import type { Project, Alert } from './types';
import { analyzeTrend } from './riskEngine';

export interface Citation {
  projectId: string;
  projectName: string;
  sector: string;
}

import type { Project, Alert } from './types';
import { analyzeTrend } from './riskEngine';

export interface Citation {
  projectId: string;
  projectName: string;
  sector: string;
}

export interface AssistantAnswer {
  text: string;
  citations: Citation[];
}

function formatCurrency(cr: number): string {
  if (cr >= 1000) return `₹${(cr / 1000).toFixed(2)}k Cr`;
  return `₹${cr.toFixed(1)} Cr`;
}

// Generate a summary of projects to pass as context
function generateContext(projects: Project[], alerts: Alert[]): string {
  const projSummaries = projects.map(p => {
    const trend = analyzeTrend(p);
    return `ID: ${p.id} | Name: ${p.name} | Sector: ${p.sector} | State: ${p.state}
Risk: ${p.riskLevel} (${(p.riskScore * 100).toFixed(0)}%)
Cost Overrun: ${p.costOverrunPct.toFixed(1)}% (Revised: ${formatCurrency(p.revisedCostCr)}, Approved: ${formatCurrency(p.approvedCostCr)})
Delay: ${Math.round(p.delayDays / 30)} months (Original completion: ${p.originalCompletionDate})
Top Risk Drivers: ${p.shapFactors.filter(f => f.direction === 'risk_up').slice(0, 3).map(f => `${f.feature}`).join(', ')}`;
  }).join('\n\n');

  const alertSummaries = alerts.map(a => `${a.level} Alert for ${a.projectName} (${a.projectId}) - Triggered by: ${a.triggeringFactors.map(f => f.feature).join(', ')}`).join('\n');

  return `Here is the current portfolio data:\n\n### PROJECTS\n${projSummaries}\n\n### ACTIVE ALERTS\n${alertSummaries || 'No active alerts.'}\n`;
}

export async function answerQuery(
  query: string,
  projects: Project[],
  alerts: Alert[],
): Promise<AssistantAnswer> {
  const context = generateContext(projects, alerts);

  const systemPrompt = `You are Saarthi, an AI assistant for infrastructure project monitoring. 
Use the provided portfolio data to answer the user's questions accurately.
Be concise, analytical, and professional. Do not hallucinate data that is not in the context.

${context}`;

  try {
    const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || "";
    const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "";

    let response;
    let retries = 3;
    let delay = 2000;
    
    while (retries > 0) {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          stream: false
        })
      });

      if (response.ok) {
        break;
      }
      
      if (response.status === 429) {
        retries--;
        if (retries === 0) break;
        console.warn(`Rate limited (429). Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // exponential backoff
      } else {
        break; // Break on other errors (401, 500, etc)
      }
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        throw new Error("Rate limit exceeded. The free API receives too many requests. Please wait a moment and try again.");
      }
      
      const errorText = await response?.text().catch(() => '') || '';
      throw new Error(`API returned status: ${response?.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    // Basic heuristic to extract citations: find any mentioned project IDs in the response
    const citations: Citation[] = [];
    const usedProjectIds = new Set<string>();
    
    for (const p of projects) {
      if ((text.includes(p.id) || text.includes(p.name)) && !usedProjectIds.has(p.id)) {
        citations.push({ projectId: p.id, projectName: p.name, sector: p.sector });
        usedProjectIds.add(p.id);
      }
    }

    return {
      text,
      citations,
    };
  } catch (err: any) {
    console.error("Assistant LLM Error:", err);
    return {
      text: `Error connecting to the AI Agent: ${err.message}`,
      citations: [],
    };
  }
}

export const SUGGESTED_QUESTIONS = [
  'Which projects have the highest risk?',
  'Show me projects with cost overruns',
  'What are the active alerts?',
  'How does the risk model work?',
  'Summarize performance by sector',
  'Which projects are delayed the most?',
];
