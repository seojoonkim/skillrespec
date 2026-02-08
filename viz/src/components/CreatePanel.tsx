// ═══════════════════════════════════════════════════════════
// Create Panel - Skill Creation Wizard
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { theme } from '../styles/theme';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

type SkillTemplate = 'basic' | 'api-integration' | 'browser-automation' | 'data-processing';

interface SkillFormData {
  name: string;
  description: string;
  category: string;
  tools: string[];
  template: SkillTemplate;
}

interface TemplateInfo {
  id: SkillTemplate;
  name: string;
  icon: string;
  description: string;
  defaultTools: string[];
  files: string[];
}

// ═══════════════════════════════════════════════════════════
// Templates
// ═══════════════════════════════════════════════════════════

const templates: TemplateInfo[] = [
  {
    id: 'basic',
    name: 'Basic',
    icon: '📦',
    description: 'Simple skill with minimal configuration',
    defaultTools: ['read', 'write'],
    files: ['SKILL.md', 'README.md'],
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    icon: '🔌',
    description: 'Connect to external APIs and services',
    defaultTools: ['web_fetch', 'web_search', 'exec'],
    files: ['SKILL.md', 'README.md', 'config.json', 'lib/api.ts'],
  },
  {
    id: 'browser-automation',
    name: 'Browser Automation',
    icon: '🌐',
    description: 'Automate web interactions and scraping',
    defaultTools: ['browser', 'web_fetch'],
    files: ['SKILL.md', 'README.md', 'lib/browser.ts', 'selectors.json'],
  },
  {
    id: 'data-processing',
    name: 'Data Processing',
    icon: '📊',
    description: 'Transform and analyze data',
    defaultTools: ['read', 'write', 'exec'],
    files: ['SKILL.md', 'README.md', 'lib/processor.ts', 'schemas/'],
  },
];

const availableTools = [
  { id: 'read', name: 'Read', icon: '📖' },
  { id: 'write', name: 'Write', icon: '✏️' },
  { id: 'edit', name: 'Edit', icon: '🔧' },
  { id: 'exec', name: 'Exec', icon: '⚡' },
  { id: 'browser', name: 'Browser', icon: '🌐' },
  { id: 'web_fetch', name: 'Web Fetch', icon: '📥' },
  { id: 'web_search', name: 'Web Search', icon: '🔍' },
  { id: 'message', name: 'Message', icon: '💬' },
  { id: 'nodes', name: 'Nodes', icon: '📱' },
  { id: 'canvas', name: 'Canvas', icon: '🎨' },
];

const categories = [
  'productivity', 'development', 'security', 'data',
  'communication', 'design', 'media', 'utility', 'devops', 'marketing',
];

// ═══════════════════════════════════════════════════════════
// SKILL.md Generator
// ═══════════════════════════════════════════════════════════

function generateSkillMd(data: SkillFormData): string {
  const template = templates.find(t => t.id === data.template)!;
  const toolsList = data.tools.map(t => `  - ${t}`).join('\n');
  
  return `# ${data.name}

${data.description}

## Category
${data.category}

## Template
${template.name} (${template.id})

## Required Tools
${toolsList}

## Usage

\`\`\`
# Example usage
${data.name.toLowerCase().replace(/\s+/g, '-')} --help
\`\`\`

## Configuration

Add any configuration details here.

## Notes

- Created with SkillRespec Wizard
- Template: ${template.name}
`;
}

function generateReadme(data: SkillFormData): string {
  return `# ${data.name}

${data.description}

## Installation

\`\`\`bash
# Clone or copy to your skills directory
cp -r ${data.name.toLowerCase().replace(/\s+/g, '-')} ~/.openclaw/skills/
\`\`\`

## Requirements

This skill requires the following tools:
${data.tools.map(t => `- \`${t}\``).join('\n')}

## License

MIT
`;
}

// ═══════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════

function TemplateCard({ 
  template, 
  selected, 
  onClick 
}: { 
  template: TemplateInfo; 
  selected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px',
        background: selected ? theme.colors.bgElevated : theme.colors.bgTertiary,
        border: `2px solid ${selected ? theme.colors.textPrimary : theme.colors.border}`,
        borderRadius: theme.radius.lg,
        cursor: 'pointer',
        textAlign: 'left',
        transition: theme.transitions.fast,
        width: '100%',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '20px' }}>{template.icon}</span>
        <span style={{
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
        }}>
          {template.name}
        </span>
        {selected && (
          <span style={{
            marginLeft: 'auto',
            color: theme.colors.success,
            fontSize: '14px',
          }}>✓</span>
        )}
      </div>
      <div style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        lineHeight: 1.4,
      }}>
        {template.description}
      </div>
    </button>
  );
}

function FilePreview({ files }: { files: string[] }) {
  return (
    <div style={{
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.md,
      padding: '12px',
      fontFamily: theme.fonts.mono,
      fontSize: theme.fontSize.xs,
    }}>
      <div style={{
        color: theme.colors.textMuted,
        marginBottom: '8px',
        fontSize: theme.fontSize.xs,
      }}>
        📁 Generated structure:
      </div>
      {files.map((file, i) => (
        <div key={i} style={{
          color: theme.colors.textSecondary,
          padding: '3px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ color: theme.colors.textMuted }}>
            {file.endsWith('/') ? '📂' : '📄'}
          </span>
          {file}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════

interface CreatePanelProps {
  embedded?: boolean;
}

export default function CreatePanel({ embedded = false }: CreatePanelProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<SkillFormData>({
    name: '',
    description: '',
    category: 'utility',
    tools: ['read', 'write'],
    template: 'basic',
  });
  const [copySuccess, setCopySuccess] = useState(false);
  
  const selectedTemplate = useMemo(() => 
    templates.find(t => t.id === formData.template)!,
    [formData.template]
  );
  
  const generatedContent = useMemo(() => ({
    skillMd: generateSkillMd(formData),
    readme: generateReadme(formData),
  }), [formData]);
  
  const handleTemplateSelect = (templateId: SkillTemplate) => {
    const template = templates.find(t => t.id === templateId)!;
    setFormData(prev => ({
      ...prev,
      template: templateId,
      tools: template.defaultTools,
    }));
  };
  
  const handleToolToggle = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId],
    }));
  };
  
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent.skillMd);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleDownload = () => {
    const blob = new Blob([generatedContent.skillMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SKILL.md';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const canProceed = step === 1 
    ? formData.template !== null
    : step === 2
      ? formData.name.trim() && formData.description.trim()
      : true;

  const containerStyle: React.CSSProperties = {
    background: embedded ? 'transparent' : theme.colors.bgSecondary,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgTertiary,
      }}>
        <h2 style={{
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🛠️ Create Skill
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px',
        }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1,
              height: '3px',
              borderRadius: theme.radius.full,
              background: s <= step ? theme.colors.textPrimary : theme.colors.border,
              transition: theme.transitions.fast,
            }} />
          ))}
        </div>
        <div style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          marginTop: '6px',
        }}>
          Step {step}/3: {step === 1 ? 'Choose Template' : step === 2 ? 'Configure' : 'Preview & Export'}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Step 1: Template Selection */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: '4px',
            }}>
              Select a template to get started:
            </div>
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={formData.template === template.id}
                onClick={() => handleTemplateSelect(template.id)}
              />
            ))}
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                Skill Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Git Automation"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.textPrimary,
                  fontSize: theme.fontSize.sm,
                  fontFamily: theme.fonts.sans,
                  outline: 'none',
                }}
              />
            </div>
            
            {/* Description */}
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this skill do?"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.textPrimary,
                  fontSize: theme.fontSize.sm,
                  fontFamily: theme.fonts.sans,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
            
            {/* Category */}
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.textPrimary,
                  fontSize: theme.fontSize.sm,
                  fontFamily: theme.fonts.sans,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} style={{ textTransform: 'capitalize' }}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tools */}
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                Required Tools
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {availableTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolToggle(tool.id)}
                    style={{
                      padding: '6px 10px',
                      background: formData.tools.includes(tool.id)
                        ? theme.colors.bgElevated
                        : 'transparent',
                      border: `1px solid ${formData.tools.includes(tool.id)
                        ? theme.colors.textPrimary
                        : theme.colors.border}`,
                      borderRadius: theme.radius.full,
                      color: formData.tools.includes(tool.id)
                        ? theme.colors.textPrimary
                        : theme.colors.textMuted,
                      fontSize: theme.fontSize.xs,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: theme.transitions.fast,
                    }}
                  >
                    <span>{tool.icon}</span>
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Export */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* File Preview */}
            <FilePreview files={[
              `${formData.name.toLowerCase().replace(/\s+/g, '-')}/`,
              ...selectedTemplate.files.map(f => `  ${f}`),
            ]} />
            
            {/* SKILL.md Preview */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}>
                <span style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  SKILL.md Preview
                </span>
              </div>
              <pre style={{
                background: theme.colors.bgTertiary,
                borderRadius: theme.radius.md,
                padding: '12px',
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.mono,
                overflow: 'auto',
                maxHeight: '200px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}>
                {generatedContent.skillMd}
              </pre>
            </div>
            
            {/* Export Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
            }}>
              <button
                onClick={handleCopyToClipboard}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: copySuccess ? theme.colors.success + '20' : theme.colors.bgTertiary,
                  border: `1px solid ${copySuccess ? theme.colors.success : theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  color: copySuccess ? theme.colors.success : theme.colors.textPrimary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: theme.transitions.fast,
                }}
              >
                {copySuccess ? '✓ Copied!' : '📋 Copy to Clipboard'}
              </button>
              <button
                onClick={handleDownload}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: theme.colors.textPrimary,
                  border: 'none',
                  borderRadius: theme.radius.md,
                  color: theme.colors.bgPrimary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: theme.transitions.fast,
                }}
              >
                ⬇️ Download SKILL.md
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div style={{
        padding: '14px 16px',
        borderTop: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgTertiary,
        display: 'flex',
        gap: '10px',
      }}>
        {step > 1 && (
          <button
            onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        )}
        {step < 3 && (
          <button
            onClick={() => setStep(prev => (prev + 1) as 1 | 2 | 3)}
            disabled={!canProceed}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: canProceed ? theme.colors.textPrimary : theme.colors.bgTertiary,
              border: 'none',
              borderRadius: theme.radius.md,
              color: canProceed ? theme.colors.bgPrimary : theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              cursor: canProceed ? 'pointer' : 'not-allowed',
              transition: theme.transitions.fast,
            }}
          >
            Next →
          </button>
        )}
        {step === 3 && (
          <button
            onClick={() => {
              setStep(1);
              setFormData({
                name: '',
                description: '',
                category: 'utility',
                tools: ['read', 'write'],
                template: 'basic',
              });
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            🔄 Create Another
          </button>
        )}
      </div>
    </div>
  );
}
