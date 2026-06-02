/**
 * PDF Report Generator
 * 
 * Creates comprehensive, well-formatted PDF reports with charts,
 * psychological frameworks, and personalized insights.
 */

import { sanitizeCommunityInsights } from './communitySafety';

export async function generateDecisionPDF(decisionData) {
    const { default: jsPDF } = await import('jspdf');
    const { title, description, analysis, timestamp, chartElement } = decisionData;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const M = 18; // margin
    const CW = W - 2 * M; // content width
    let y = M;

    // ── Colors ──
    const C = {
        primary: [99, 102, 241],
        purple: [139, 92, 246],
        teal: [45, 212, 191],
        danger: [244, 63, 94],
        warning: [251, 191, 36],
        positive: [52, 211, 153],
        dark: [30, 30, 30],
        mid: [80, 80, 80],
        light: [120, 120, 120],
        faint: [160, 160, 160],
        white: [255, 255, 255],
        bgLight: [248, 247, 255],
        bgWarm: [255, 250, 245],
        bgTeal: [240, 253, 250],
        bgDanger: [255, 245, 247],
    };

    // ── Helpers ──
    const newPage = (needed = 20) => {
        if (y + needed > H - 20) {
            addFooter();
            pdf.addPage();
            y = M;
            return true;
        }
        return false;
    };

    const addFooter = () => {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(...C.faint);
        pdf.text('Decision Mirror — AI-Powered Decision Intelligence', W / 2, H - 8, { align: 'center' });
        pdf.text(`Page ${pdf.getNumberOfPages()}`, W - M, H - 8, { align: 'right' });
    };

    const txt = (text, size = 10, style = 'normal', color = C.dark, indent = 0, maxW = null) => {
        if (!text) return;
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);
        pdf.setTextColor(...color);
        const w = maxW || (CW - indent);
        const lines = pdf.splitTextToSize(String(text), w);
        lines.forEach(line => {
            newPage(size * 0.45 + 2);
            pdf.text(line, M + indent, y);
            y += size * 0.45;
        });
        y += 2;
    };

    const heading = (title) => {
        newPage(22);
        y += 6;
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...C.primary);
        pdf.text(title, M, y);
        y += 2;
        pdf.setDrawColor(220, 220, 240);
        pdf.setLineWidth(0.5);
        pdf.line(M, y, W - M, y);
        y += 6;
    };

    // ═══════════════ COVER HEADER ═══════════════
    pdf.setFillColor(...C.primary);
    pdf.rect(0, 0, W, 55, 'F');
    // Accent line
    pdf.setFillColor(...C.teal);
    pdf.rect(0, 55, W, 2, 'F');

    pdf.setTextColor(...C.white);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Decision Mirror', M, 22);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AI-Powered Decision Intelligence Report', M, 32);

    pdf.setFontSize(9);
    pdf.text(`Generated: ${new Date(timestamp || Date.now()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, M, 44);

    y = 68;

    // ═══════════════ DECISION CONTEXT ═══════════════
    const displayTitle = analysis?.verdict?.title || title || 'Decision Analysis';
    pdf.setTextColor(...C.dark);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(displayTitle, CW);
    pdf.text(titleLines, M, y);
    y += (titleLines.length * 9) + 6;

    txt('The Situation', 9, 'bold', C.light);
    txt(description, 10, 'normal', C.mid);
    y += 4;

    if (!analysis?.verdict) {
        txt('Legacy analysis format — view full details in the app.', 10, 'italic', C.light);
        addFooter();
        pdf.save(`decision-mirror-${Date.now()}.pdf`);
        return;
    }

    const v = analysis.verdict;

    // ═══════════════ 1. VERDICT ═══════════════
    heading('The Verdict');
    txt(v.recommendation, 11, 'normal', C.dark);
    y += 2;

    // Confidence + Reversibility inline
    const confLabel = v.confidence === 'high' ? 'HIGH CONFIDENCE' : v.confidence === 'medium' ? 'MODERATE CONFIDENCE' : 'LOW CONFIDENCE';
    const confColor = v.confidence === 'high' ? C.positive : v.confidence === 'medium' ? C.warning : C.danger;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...confColor);
    pdf.text(confLabel, M, y);
    if (v.reversibility) {
        pdf.setTextColor(...C.teal);
        pdf.text(`|  Reversibility: ${v.reversibility}`, M + 45, y);
    }
    y += 8;

    // ═══════════════ 1b. SCORE CARDS ═══════════════
    const sc2 = analysis.scores;
    if (sc2) {
        newPage(30);
        const confMap = { high: 85, medium: 60, low: 30 };
        const cards = [
            { label: 'Emotion Risk', val: sc2.emotionRisk ?? analysis.emotionalScore ?? 50 },
            { label: 'Bias Risk', val: sc2.biasRisk ?? 40 },
            { label: 'Complexity', val: sc2.complexityScore ?? 50 },
            { label: 'Confidence', val: sc2.confidenceScore ?? confMap[v.confidence] ?? 50 },
            { label: 'Clarity', val: sc2.clarityScore ?? 50 },
            { label: 'Urgency', val: sc2.urgencyScore ?? 40 },
        ];
        const cardW = (CW - 10) / 3;
        cards.forEach((card, ci) => {
            const col = ci % 3;
            const row = Math.floor(ci / 3);
            const cx = M + col * (cardW + 5);
            const cy = y + row * 18;
            pdf.setFillColor(248, 248, 255);
            pdf.roundedRect(cx, cy, cardW, 15, 2, 2, 'F');
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...C.dark);
            pdf.text(card.label, cx + 4, cy + 5);
            const lvl = card.label === 'Confidence' || card.label === 'Clarity'
                ? (card.val > 65 ? 'high' : card.val > 35 ? 'moderate' : 'low')
                : (card.val > 65 ? 'high' : card.val > 35 ? 'moderate' : 'low');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...C.light);
            pdf.text(`${lvl} (${card.val}/100)`, cx + 4, cy + 9);
            // Progress bar
            const barColor = (card.label === 'Confidence' || card.label === 'Clarity')
                ? (card.val > 65 ? C.positive : card.val > 35 ? C.warning : C.danger)
                : (card.val > 65 ? C.danger : card.val > 35 ? C.warning : C.positive);
            pdf.setFillColor(230, 230, 240);
            pdf.roundedRect(cx + 4, cy + 11, cardW - 8, 2, 1, 1, 'F');
            pdf.setFillColor(...barColor);
            pdf.roundedRect(cx + 4, cy + 11, (cardW - 8) * card.val / 100, 2, 1, 1, 'F');
        });
        y += Math.ceil(cards.length / 3) * 18 + 4;
    }

    // ═══════════════ 2. EMOTIONAL INSIGHT ═══════════════
    if (analysis.emotionalInsight) {
        heading('What\'s Really Going On');
        txt(`"${analysis.emotionalInsight.feeling}"`, 12, 'bolditalic', C.purple);
        y += 1;
        txt(analysis.emotionalInsight.explanation, 10, 'normal', C.mid);
        if (analysis.emotionalInsight.hiddenDesire) {
            y += 2;
            txt('What you might actually want:', 9, 'bold', C.purple);
            txt(analysis.emotionalInsight.hiddenDesire, 10, 'normal', C.dark);
        }
        y += 4;
    }

    // ═══════════════ 3. CORE CONFLICT ═══════════════
    if (analysis.coreConflict) {
        heading('The Real Tension');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...C.dark);
        const conflictText = `${analysis.coreConflict.sideA}  vs  ${analysis.coreConflict.sideB}`;
        pdf.text(conflictText, W / 2, y, { align: 'center' });
        y += 8;
        txt(analysis.coreConflict.explanation, 10, 'normal', C.mid);
        y += 4;
    }

    // ═══════════════ 4. COGNITIVE BIASES ═══════════════
    const biases = analysis.cognitiveDistortions || [];
    if (biases.length > 0) {
        heading('Cognitive Biases Detected');
        biases.forEach((b, i) => {
            newPage(30);
            // Bias name with colored marker
            pdf.setFillColor(...(i === 0 ? C.danger : i === 1 ? C.warning : C.primary));
            pdf.rect(M, y - 3, 2, 14, 'F');
            txt(b.bias, 11, 'bold', C.dark, 6);
            if (b.evidence) txt(`Evidence: "${b.evidence}"`, 9, 'italic', C.light, 6);
            if (b.impact) txt(b.impact, 9, 'normal', C.mid, 6);
            if (b.antidote) txt(`Reframe: ${b.antidote}`, 9, 'normal', C.primary, 6);
            if (b.research) txt(`${b.research}`, 8, 'italic', C.faint, 6);
            y += 4;
        });
    }

    // ═══════════════ 5. DEVIL'S ADVOCATE ═══════════════
    if (analysis.devilsAdvocate) {
        heading('Devil\'s Advocate');
        txt(`"${analysis.devilsAdvocate}"`, 10, 'italic', [140, 50, 50]);
        txt('This is the strongest argument against your preference. If you can address it, your decision is stronger.', 8, 'normal', C.faint);
        y += 4;
    }

    // ═══════════════ 6. PATH FORWARD ═══════════════
    if (analysis.pathForward?.length > 0) {
        heading('Your Path Forward');
        analysis.pathForward.forEach((step, i) => {
            newPage(20);
            pdf.setFillColor(...C.primary);
            pdf.circle(M + 4, y - 1, 3, 'F');
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...C.white);
            pdf.text(String(step.step || i + 1), M + 4, y, { align: 'center' });

            txt(step.action, 10, 'bold', C.dark, 12);
            txt(step.why, 9, 'normal', C.mid, 12);
            if (step.timeframe) txt(`Timeline: ${step.timeframe}`, 8, 'italic', C.primary, 12);
            y += 3;
        });
    }

    // ═══════════════ 7. 10-10-10 ANALYSIS ═══════════════
    const ttt = analysis.tenTenTen;
    if (ttt) {
        heading('10-10-10 Analysis — Suzy Welch Framework');
        const items = Array.isArray(ttt) ? ttt : [ttt];
        items.forEach(item => {
            if (item.option) txt(item.option, 10, 'bold', C.dark);
            newPage(35);
            // Draw three columns
            const colW = (CW - 8) / 3;
            const periods = [
                { label: '10 MINUTES', text: item.tenMinutes, color: C.teal },
                { label: '10 MONTHS', text: item.tenMonths, color: C.primary },
                { label: '10 YEARS', text: item.tenYears, color: C.purple },
            ];
            const boxY = y;
            periods.forEach((p, pi) => {
                const x = M + pi * (colW + 4);
                pdf.setFillColor(248, 248, 255);
                pdf.roundedRect(x, boxY, colW, 30, 2, 2, 'F');
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(...p.color);
                pdf.text(p.label, x + colW / 2, boxY + 6, { align: 'center' });
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...C.mid);
                const lines = pdf.splitTextToSize(p.text || '', colW - 6);
                lines.slice(0, 4).forEach((line, li) => {
                    pdf.text(line, x + 3, boxY + 12 + li * 4);
                });
            });
            y = boxY + 35;
        });
    }

    // ═══════════════ 8. SCENARIO PLANNING ═══════════════
    const sc = analysis.scenarios;
    if (sc) {
        heading('Scenario Planning');
        const isObj = !Array.isArray(sc);
        if (isObj) {
            const scItems = [
                { label: 'BEST CASE', text: sc.best, color: C.positive, bg: C.bgTeal },
                { label: 'MOST LIKELY', text: sc.likely, color: C.primary, bg: C.bgLight },
                { label: 'WORST CASE', text: sc.worst, color: C.danger, bg: C.bgDanger },
            ];
            scItems.forEach(item => {
                newPage(18);
                pdf.setFillColor(...item.bg);
                const lines = pdf.splitTextToSize(item.text || '', CW - 30);
                const bh = Math.max(12, 8 + lines.length * 4);
                pdf.roundedRect(M, y - 3, CW, bh, 2, 2, 'F');
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(...item.color);
                pdf.text(item.label, M + 4, y + 2);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...C.mid);
                lines.forEach((line, li) => {
                    pdf.text(line, M + 28, y + 2 + li * 4);
                });
                y += bh + 3;
            });
        } else {
            sc.forEach(item => {
                if (item.option) txt(item.option, 10, 'bold', C.dark);
                txt(`Best (${item.best?.probability}%): ${item.best?.scenario}`, 9, 'normal', C.positive, 5);
                txt(`Likely (${item.likely?.probability}%): ${item.likely?.scenario}`, 9, 'normal', C.primary, 5);
                txt(`Worst (${item.worst?.probability}%): ${item.worst?.scenario}`, 9, 'normal', C.danger, 5);
                y += 4;
            });
        }
    }

    // ═══════════════ 9. PRE-MORTEM ═══════════════
    const pm = analysis.preMortem;
    if (pm?.length > 0) {
        heading('Pre-Mortem Analysis — Gary Klein (1998)');
        txt('If this decision fails, what went wrong?', 9, 'italic', C.light);
        y += 2;
        pm.forEach(item => {
            newPage(20);
            if (item.failure) {
                // AI format
                const probColor = item.probability === 'high' ? C.danger : item.probability === 'medium' ? C.warning : C.positive;
                const probLabel = item.probability === 'high' ? '[HIGH]' : item.probability === 'medium' ? '[MED]' : '[LOW]';
                txt(`${probLabel} ${item.failure}`, 10, 'bold', probColor, 3);
                if (item.earlyWarning) txt(`Early warning: ${item.earlyWarning}`, 9, 'italic', C.warning, 8);
                if (item.prevention) txt(`Prevention: ${item.prevention}`, 9, 'normal', C.mid, 8);
            } else if (item.failures) {
                // Local engine format
                if (item.option) txt(`If "${item.option}" fails:`, 10, 'bold', C.danger);
                item.failures.forEach(f => {
                    txt(`• ${f.scenario}`, 9, 'bold', C.mid, 5);
                    txt(f.mitigation, 9, 'normal', C.light, 10);
                });
            }
            y += 3;
        });
    }

    // ═══════════════ 10. ASSUMPTIONS AUDIT ═══════════════
    const assumptions = analysis.assumptions || [];
    if (assumptions.length > 0) {
        heading('Assumptions Audit');
        txt('These are assumptions underlying this decision. Verify each one.', 9, 'italic', C.light);
        y += 2;
        assumptions.forEach((a) => {
            newPage(10);
            const text = typeof a === 'string' ? a : a.text;
            pdf.setFillColor(248, 248, 255);
            const lines = pdf.splitTextToSize(text || '', CW - 14);
            const bh = 4 + lines.length * 4;
            pdf.roundedRect(M, y - 3, CW, bh, 1, 1, 'F');
            // Checkbox
            pdf.setDrawColor(...C.primary);
            pdf.setLineWidth(0.3);
            pdf.rect(M + 3, y - 1, 3, 3);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...C.dark);
            lines.forEach((line, li) => {
                pdf.text(line, M + 10, y + 1 + li * 4);
            });
            y += bh + 2;
        });
    }

    // ═══════════════ 11. BLIND SPOTS ═══════════════
    if (analysis.blindSpots?.length > 0) {
        heading('Blind Spots');
        analysis.blindSpots.forEach(spot => {
            newPage(16);
            txt(spot.title, 10, 'bold', C.warning);
            txt(spot.insight, 9, 'normal', C.mid, 5);
            y += 3;
        });
    }

    // ═══════════════ 12. RISKS ═══════════════
    if (analysis.risks?.length > 0) {
        heading('Risk Radar');
        analysis.risks.forEach(risk => {
            newPage(14);
            const lColor = risk.likelihood === 'high' ? C.danger : risk.likelihood === 'medium' ? C.warning : C.positive;
            pdf.setFillColor(...lColor);
            pdf.circle(M + 3, y, 2, 'F');
            txt(`${risk.risk}`, 10, 'bold', C.dark, 8);
            txt(`Mitigation: ${risk.mitigation}`, 9, 'normal', C.mid, 8);
            y += 2;
        });
    }

    // ═══════════════ 14. IMPACT RADAR CHART ═══════════════
    if (chartElement) {
        try {
            const { default: html2canvas } = await import('html2canvas');
            newPage(90);
            heading('Impact Profile Radar');
            const canvas = await html2canvas(chartElement, {
                backgroundColor: '#F4F1EA',
                scale: 2,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const imgW = CW * 0.8;
            const imgH = (canvas.height * imgW) / canvas.width;
            const imgX = M + (CW - imgW) / 2;
            pdf.addImage(imgData, 'PNG', imgX, y, imgW, Math.min(imgH, 80));
            y += Math.min(imgH, 80) + 6;
        } catch (e) {
            console.warn('Chart capture failed:', e);
        }
    }

    // ═══════════════ 15. IMPACT SCORING TABLE ═══════════════
    const impactScores = analysis.impactScores || analysis.localEngine?.impactScores || [];
    if (impactScores.length > 0) {
        newPage(40);
        if (!chartElement) heading('Decision Science Data');
        const dims = ['financial', 'emotional', 'relationships', 'growth', 'time', 'values'];
        const dimLabels = ['Fin', 'Emo', 'Rel', 'Growth', 'Time', 'Values', 'Total'];
        const colW = CW / (dims.length + 2);
        const tableX = M;

        // Header row
        pdf.setFillColor(...C.primary);
        pdf.rect(tableX, y - 3, CW, 8, 'F');
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...C.white);
        pdf.text('Option', tableX + 2, y + 1);
        dimLabels.forEach((label, i) => {
            pdf.text(label, tableX + colW + i * colW + 2, y + 1);
        });
        y += 8;

        // Data rows
        impactScores.forEach((row, ri) => {
            newPage(10);
            if (ri % 2 === 0) {
                pdf.setFillColor(248, 248, 255);
                pdf.rect(tableX, y - 3, CW, 7, 'F');
            }
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...C.dark);
            const optLabel = (row.option || '').length > 18 ? row.option.slice(0, 17) + '…' : row.option;
            pdf.text(optLabel || '', tableX + 2, y + 1);
            dims.forEach((d, di) => {
                const val = row.scores?.[d] ?? '-';
                pdf.text(String(val), tableX + colW + di * colW + 2, y + 1);
            });
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...C.primary);
            pdf.text(String(row.totalScore || ''), tableX + colW + dims.length * colW + 2, y + 1);
            y += 7;
        });
        y += 6;
    }

    // ═══════════════ 16. COMMUNITY INSIGHTS ═══════════════
    const rawCommunityInsights = analysis.communityInsights || [];
    const { items: ci, hadInput: hadCommunityInput } = sanitizeCommunityInsights(rawCommunityInsights, { description });
    if (ci.length > 0) {
        heading('What People Say');
        txt('Perspectives from people who\'ve faced similar decisions:', 9, 'italic', C.light);
        y += 2;
        ci.forEach(item => {
            newPage(20);
            const sub = item.source?.startsWith('r/') ? item.source : `r/${item.source || 'advice'}`;
            const sentColor = item.sentiment === 'supportive' ? C.positive : item.sentiment === 'cautionary' ? C.warning : C.purple;
            pdf.setFillColor(...sentColor);
            pdf.rect(M, y - 3, 2, 12, 'F');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...sentColor);
            pdf.text(`${sub}  |  ${item.sentiment || 'mixed'}${item.upvotes ? `  |  ${item.upvotes} upvotes` : ''}`, M + 6, y);
            y += 4;
            txt(`"${item.insight}"`, 9, 'italic', C.mid, 6);
            y += 3;
        });
    } else if (hadCommunityInput) {
        heading('What People Say');
        txt('Community examples were withheld for safety. For practical next steps, seek support-oriented resources like r/Advice, r/personalfinance, or r/legaladvice.', 9, 'italic', C.light);
    }

    // ═══════════════ 17. THE MIRROR ═══════════════
    if (analysis.reflectionQuestion) {
        newPage(30);
        y += 4;
        pdf.setFillColor(240, 253, 250);
        pdf.setDrawColor(...C.teal);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(M, y - 4, CW, 28, 3, 3, 'FD');

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...C.teal);
        pdf.text('THE MIRROR', M + 5, y + 2);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bolditalic');
        pdf.setTextColor(...C.dark);
        const qLines = pdf.splitTextToSize(`"${analysis.reflectionQuestion}"`, CW - 14);
        qLines.forEach((line, i) => {
            pdf.text(line, M + 5, y + 10 + i * 5);
        });
        y += 34;
    }

    // ═══════════════ FOOTER ON LAST PAGE ═══════════════
    addFooter();

    pdf.save(`decision-mirror-${Date.now()}.pdf`);
}
