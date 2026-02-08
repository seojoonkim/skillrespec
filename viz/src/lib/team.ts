// ═══════════════════════════════════════════════════════════
// Team Sync - Supabase + Mock Mode Support
// ═══════════════════════════════════════════════════════════

import { supabase } from './supabase';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface Team {
  id: string;
  name: string;
  created_at: string;
  invite_code?: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at?: string;
  display_name?: string;
}

export interface TeamSkillPack {
  id?: string;
  team_id: string;
  name: string;
  skills: string[];
  created_by: string;
  created_at?: string;
  description?: string;
}

// ═══════════════════════════════════════════════════════════
// Mock Data (for local development)
// ═══════════════════════════════════════════════════════════

const MOCK_TEAMS: Team[] = [
  { id: 'mock-team-1', name: 'Frontend Team', created_at: '2024-01-15T00:00:00Z', invite_code: 'FE2024' },
  { id: 'mock-team-2', name: 'DevOps Squad', created_at: '2024-02-01T00:00:00Z', invite_code: 'DEVOPS' },
];

const MOCK_MEMBERS: TeamMember[] = [
  { team_id: 'mock-team-1', user_id: 'user-1', role: 'owner', display_name: 'Alice' },
  { team_id: 'mock-team-1', user_id: 'user-2', role: 'member', display_name: 'Bob' },
  { team_id: 'mock-team-1', user_id: 'user-3', role: 'member', display_name: 'Charlie' },
  { team_id: 'mock-team-2', user_id: 'user-4', role: 'owner', display_name: 'David' },
];

const MOCK_SKILL_PACKS: TeamSkillPack[] = [
  {
    id: 'pack-1',
    team_id: 'mock-team-1',
    name: 'Frontend Essentials',
    skills: ['prettier', 'eslint', 'typescript-helper', 'react-patterns'],
    created_by: 'user-1',
    description: 'Standard tools for frontend development',
  },
  {
    id: 'pack-2',
    team_id: 'mock-team-2',
    name: 'DevOps Toolkit',
    skills: ['docker-helper', 'k8s-assist', 'ci-cd-master', 'terraform-guide'],
    created_by: 'user-4',
    description: 'Essential DevOps automation skills',
  },
];

// ═══════════════════════════════════════════════════════════
// Mode Detection
// ═══════════════════════════════════════════════════════════

let mockMode = false;

export function enableMockMode() {
  mockMode = true;
  console.log('[Team] Mock mode enabled');
}

export function disableMockMode() {
  mockMode = false;
  console.log('[Team] Mock mode disabled');
}

export function isMockMode() {
  return mockMode;
}

// Auto-detect: if Supabase isn't configured, use mock mode
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  enableMockMode();
}

// ═══════════════════════════════════════════════════════════
// Generate Invite Code
// ═══════════════════════════════════════════════════════════

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ═══════════════════════════════════════════════════════════
// Team API Functions
// ═══════════════════════════════════════════════════════════

export async function createTeam(name: string, userId: string): Promise<{ team?: Team; error?: string }> {
  if (mockMode) {
    const newTeam: Team = {
      id: `mock-team-${Date.now()}`,
      name,
      created_at: new Date().toISOString(),
      invite_code: generateInviteCode(),
    };
    MOCK_TEAMS.push(newTeam);
    MOCK_MEMBERS.push({ team_id: newTeam.id, user_id: userId, role: 'owner' });
    return { team: newTeam };
  }

  try {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from('teams')
      .insert({ name, invite_code: inviteCode })
      .select()
      .single();

    if (error) return { error: error.message };

    // Add creator as owner
    await supabase.from('team_members').insert({
      team_id: data.id,
      user_id: userId,
      role: 'owner',
    });

    return { team: data as Team };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function getTeams(userId: string): Promise<Team[]> {
  if (mockMode) {
    const memberTeamIds = MOCK_MEMBERS
      .filter(m => m.user_id === userId)
      .map(m => m.team_id);
    return MOCK_TEAMS.filter(t => memberTeamIds.includes(t.id));
  }

  try {
    const { data: memberData } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (!memberData?.length) return [];

    const teamIds = memberData.map(m => m.team_id);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds);

    if (error || !data) return [];
    return data as Team[];
  } catch {
    return [];
  }
}

export async function joinTeamByCode(inviteCode: string, userId: string): Promise<{ team?: Team; error?: string }> {
  if (mockMode) {
    const team = MOCK_TEAMS.find(t => t.invite_code === inviteCode.toUpperCase());
    if (!team) return { error: 'Invalid invite code' };
    
    const alreadyMember = MOCK_MEMBERS.some(m => m.team_id === team.id && m.user_id === userId);
    if (alreadyMember) return { error: 'Already a member of this team' };
    
    MOCK_MEMBERS.push({ team_id: team.id, user_id: userId, role: 'member' });
    return { team };
  }

  try {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (teamError || !teamData) return { error: 'Invalid invite code' };

    // Check if already a member
    const { data: existing } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamData.id)
      .eq('user_id', userId)
      .single();

    if (existing) return { error: 'Already a member of this team' };

    // Join team
    const { error: joinError } = await supabase.from('team_members').insert({
      team_id: teamData.id,
      user_id: userId,
      role: 'member',
    });

    if (joinError) return { error: joinError.message };
    return { team: teamData as Team };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  if (mockMode) {
    return MOCK_MEMBERS.filter(m => m.team_id === teamId);
  }

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    if (error || !data) return [];
    return data as TeamMember[];
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
// Skill Pack API Functions
// ═══════════════════════════════════════════════════════════

export async function createSkillPack(
  teamId: string,
  name: string,
  skills: string[],
  createdBy: string,
  description?: string
): Promise<{ pack?: TeamSkillPack; error?: string }> {
  if (mockMode) {
    const newPack: TeamSkillPack = {
      id: `pack-${Date.now()}`,
      team_id: teamId,
      name,
      skills,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      description,
    };
    MOCK_SKILL_PACKS.push(newPack);
    return { pack: newPack };
  }

  try {
    const { data, error } = await supabase
      .from('team_skill_packs')
      .insert({ team_id: teamId, name, skills, created_by: createdBy, description })
      .select()
      .single();

    if (error) return { error: error.message };
    return { pack: data as TeamSkillPack };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function getTeamSkillPacks(teamId: string): Promise<TeamSkillPack[]> {
  if (mockMode) {
    return MOCK_SKILL_PACKS.filter(p => p.team_id === teamId);
  }

  try {
    const { data, error } = await supabase
      .from('team_skill_packs')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as TeamSkillPack[];
  } catch {
    return [];
  }
}

export async function deleteSkillPack(packId: string): Promise<{ success: boolean; error?: string }> {
  if (mockMode) {
    const idx = MOCK_SKILL_PACKS.findIndex(p => p.id === packId);
    if (idx >= 0) {
      MOCK_SKILL_PACKS.splice(idx, 1);
      return { success: true };
    }
    return { success: false, error: 'Pack not found' };
  }

  try {
    const { error } = await supabase
      .from('team_skill_packs')
      .delete()
      .eq('id', packId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ═══════════════════════════════════════════════════════════
// Deploy Skill Pack (install all skills from pack)
// ═══════════════════════════════════════════════════════════

export function generateInstallCommands(skills: string[]): string[] {
  return skills.map(skill => `clawhub install ${skill}`);
}

export function generateBatchInstallCommand(skills: string[]): string {
  return `clawhub install ${skills.join(' ')}`;
}
