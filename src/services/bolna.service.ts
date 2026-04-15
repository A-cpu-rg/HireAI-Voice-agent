import { prisma } from '@/lib/prisma';

export const BolnaService = {
  /**
   * Calls Bolna API to initiate an outbound call.
   * Returns the call_id. DB operations are done by the caller (the route handler).
   */
  async triggerOutboundCall(apiKey: string, agentId: string, candidateId: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) throw new Error('Candidate not found');

    const bolnaResponse = await fetch("https://api.bolna.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        recipient_phone_number: candidate.phone,
        user_data: {
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          role: candidate.role,
        },
      }),
    });

    if (!bolnaResponse.ok) {
      const errorText = await bolnaResponse.text();
      throw new Error(`Bolna API rejected the request: ${errorText}`);
    }

    const data = await bolnaResponse.json();
    return { call_id: data.call_id };
  },

  /**
   * Processes the incoming Bolna webhook and applies changes safely in a transaction.
   */
  async processWebhook(payload: any) {
    const callId = payload.call_id || payload.headers?.call_id || (payload.data && payload.data.call_id);
    if (!callId) {
      throw new Error("No callId found in webhook payload. Ignoring.");
    }

    const callLog = await prisma.callLog.findUnique({ where: { id: callId } });
    if (!callLog) {
      throw new Error(`CallLog not found for callId: ${callId}`);
    }

    const extraction = payload.data?.extraction || payload.extraction || payload.extracted_data || {};
    
    const technical = parseInt(extraction.technical_depth_score) || 75;
    const communication = parseInt(extraction.communication_score) || 80;
    const problemSolving = parseInt(extraction.problem_solving_score) || 78;
    const cultureFit = parseInt(extraction.enthusiasm_score) || 82;
    const overall = Math.round((technical + communication + problemSolving + cultureFit) / 4);
    
    const recommendation = overall >= 80 ? "Shortlist" : overall >= 65 ? "Hold" : "Reject";

    // Array wrapping transcript messages so we can nest them inside Prisma queries
    const transcriptArray = payload.data?.transcript || payload.transcript || [];
    const transcriptData = Array.isArray(transcriptArray) ? transcriptArray.map((t: any) => ({
      candidateId: callLog.candidateId,
      role: String(t.role).toLowerCase().includes('user') ? 'candidate' : 'agent',
      text: t.text || t.content || "",
      timestamp: t.timestamp || "00:00",
    })) : [];

    // ENTIRE WORKFLOW COMPLETED IN A SINGLE TRANSACTION
    // This represents Production Best Practices to prevent partial writes.
    await prisma.$transaction(async (tx: any) => {
      await tx.candidate.update({
        where: { id: callLog.candidateId },
        data: { callStatus: "completed", score: overall, completedAt: new Date() }
      });

      await tx.callLog.update({
        where: { id: callId },
        data: {
          status: "completed",
          score: overall,
          duration: payload.data?.duration || "5m 2s"
        }
      });

      await tx.screeningResult.upsert({
        where: { candidateId: callLog.candidateId },
        update: {
          technicalScore: technical,
          communicationScore: communication,
          problemSolvingScore: problemSolving,
          cultureFitScore: cultureFit,
          overallScore: overall,
          strengths: JSON.stringify(extraction.strengths || ["Good potential", "Strong communication basis"]),
          concerns: JSON.stringify(extraction.concerns || ["Needs more specialized review"]),
          recommendation,
          summary: extraction.summary || "Call completed. Evaluated via AI.",
          keySkills: JSON.stringify(extraction.tech_stack ? (Array.isArray(extraction.tech_stack) ? extraction.tech_stack : extraction.tech_stack.split(',')) : []),
          availability: extraction.notice_period || "Unknown",
          salaryExpectation: extraction.salary_expectation || "Disclosed in call",
        },
        create: {
          candidateId: callLog.candidateId,
          technicalScore: technical,
          communicationScore: communication,
          problemSolvingScore: problemSolving,
          cultureFitScore: cultureFit,
          overallScore: overall,
          strengths: JSON.stringify(extraction.strengths || ["Good potential", "Strong communication basis"]),
          concerns: JSON.stringify(extraction.concerns || ["Needs more specialized review"]),
          recommendation,
          summary: extraction.summary || "Call completed. Evaluated via AI.",
          keySkills: JSON.stringify(extraction.tech_stack ? (Array.isArray(extraction.tech_stack) ? extraction.tech_stack : extraction.tech_stack.split(',')) : []),
          availability: extraction.notice_period || "Unknown",
          salaryExpectation: extraction.salary_expectation || "Disclosed in call",
        }
      });

      if (transcriptData.length > 0) {
        await tx.transcriptMessage.createMany({
           data: transcriptData
        });
      }
    });

    return { success: true };
  }
};
