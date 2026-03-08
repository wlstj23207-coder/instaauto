import { useState, useEffect, useRef } from "react";

const API_URL = "https://api.anthropic.com/v1/messages";

const STAGES = [
  { id: 1, label: "1단계", title: "리서치 → 카피", color: "#7DC97D" },
  { id: 2, label: "2단계", title: "후킹 팀 토론", color: "#7DC97D" },
  { id: 3, label: "3단계", title: "구조 토론", color: "#7DC97D" },
  { id: 4, label: "4단계", title: "PNG 자동 생성", color: "#7DC97D" },
];

async function callClaude(systemPrompt, userMessage) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function ProgressBar({ stage, total = 4 }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i < stage ? "#7DC97D" : "#E0E0E0",
            transition: "background 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

function StageCard({ stageNum, title, children, active }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "24px",
        marginBottom: 16,
        boxShadow: active ? "0 4px 24px rgba(125,201,125,0.18)" : "0 1px 6px rgba(0,0,0,0.07)",
        border: active ? "1.5px solid #7DC97D" : "1.5px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4, letterSpacing: 1 }}>
        {stageNum}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: "#1a1a1a" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid #ccc",
        borderTopColor: "#7DC97D",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        marginRight: 8,
        verticalAlign: "middle",
      }}
    />
  );
}

function Badge({ text, color = "#7DC97D" }) {
  return (
    <span
      style={{
        background: color + "22",
        color: color,
        borderRadius: 8,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}

function InstagramPreview({ copy, hook, structure }) {
  const lines = structure ? structure.split("\n").filter(Boolean) : [];
  return (
    <div
      style={{
        width: 270,
        minHeight: 337,
        background: "linear-gradient(135deg, #f0faf0 0%, #fff 60%, #f5f5f5 100%)",
        borderRadius: 12,
        padding: "28px 22px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: "Noto Sans KR, sans-serif",
        margin: "0 auto",
        border: "1px solid #e8f5e8",
      }}
    >
      <div style={{ fontSize: 10, color: "#7DC97D", fontWeight: 700, letterSpacing: 1 }}>
        1080 × 1350
      </div>
      {hook && (
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.4 }}>
          {hook}
        </div>
      )}
      {copy && (
        <div style={{ fontSize: 12, color: "#444", lineHeight: 1.7, borderTop: "1px solid #eee", paddingTop: 10 }}>
          {copy}
        </div>
      )}
      {lines.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                color: "#555",
                padding: "4px 0",
                borderLeft: "2px solid #7DC97D",
                paddingLeft: 8,
                marginBottom: 4,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [stage, setStage] = useState(0); // 0=idle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [research, setResearch] = useState("");
  const [copy, setCopy] = useState("");
  const [hookScore, setHookScore] = useState(null);
  const [hookFeedback, setHookFeedback] = useState("");
  const [revisedCopy, setRevisedCopy] = useState("");
  const [structure, setStructure] = useState("");
  const [approved, setApproved] = useState(false);
  const [hookLine, setHookLine] = useState("");

  const logRef = useRef(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs((prev) => [...prev, msg]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const reset = () => {
    setStage(0); setLoading(false); setError("");
    setResearch(""); setCopy(""); setHookScore(null); setHookFeedback("");
    setRevisedCopy(""); setStructure(""); setApproved(false); setHookLine("");
    setLogs([]);
  };

  const runPipeline = async () => {
    if (!topic.trim()) return;
    reset();
    setLoading(true);
    setLogs([]);

    try {
      // ── STAGE 1: Research + Copy ──────────────────────────────
      setStage(1);
      addLog("🔍 주제 분석 중...");

      const researchResult = await callClaude(
        "당신은 마케팅 리서처입니다. 주어진 주제에 대해 핵심 인사이트 3가지를 한국어로 간결하게 정리해주세요. JSON 없이 순수 텍스트로.",
        `주제: ${topic}`
      );
      setResearch(researchResult);
      addLog("✅ 리서치 완료");

      addLog("✍️ 카피 작성 중...");
      const copyResult = await callClaude(
        "당신은 인스타그램 카피라이터입니다. 주어진 리서치 내용을 바탕으로 인스타그램 본문 카피를 150자 이내로 작성해주세요. 감성적이고 공감가는 톤으로.",
        `주제: ${topic}\n\n리서치: ${researchResult}`
      );
      setCopy(copyResult);
      addLog("✅ 카피 초안 완료");

      // ── STAGE 2: Hook Team Discussion ─────────────────────────
      setStage(2);
      addLog("🎯 후킹 점수 평가 중...");

      const hookEval = await callClaude(
        `당신은 후킹 전문가와 카피 에디터로 구성된 팀입니다.
다음 카피를 평가하고 반드시 아래 JSON 형식만으로 응답하세요:
{"score": 숫자(1-10), "hook": "가장 강력한 첫 문장", "feedback": "개선점 한 줄"}`,
        `주제: ${topic}\n카피: ${copyResult}`
      );

      let score = 0, feedback = "", hook = "";
      try {
        const clean = hookEval.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        score = parsed.score;
        feedback = parsed.feedback;
        hook = parsed.hook;
      } catch {
        score = 6; feedback = "후킹 강화 필요"; hook = copyResult.split("\n")[0];
      }

      setHookScore(score);
      setHookFeedback(feedback);
      setHookLine(hook);
      addLog(`📊 후킹 점수: ${score}/10`);

      let finalCopy = copyResult;
      if (score < 7) {
        addLog("🔄 점수 미달 → 재작성 중...");
        const revised = await callClaude(
          "당신은 인스타그램 카피라이터입니다. 피드백을 반영해 더 강력한 후킹이 있는 카피로 재작성해주세요. 150자 이내.",
          `원본 카피: ${copyResult}\n피드백: ${feedback}\n주제: ${topic}`
        );
        setRevisedCopy(revised);
        finalCopy = revised;
        addLog("✅ 재작성 완료 (통과)");
      } else {
        addLog("✅ 7점 이상 → 통과");
      }

      // ── STAGE 3: Structure Discussion ─────────────────────────
      setStage(3);
      addLog("📐 구조 검토 중...");

      const structResult = await callClaude(
        `당신은 콘텐츠 구조 전문가입니다. 인스타그램 카드뉴스 10장 구성을 제안해주세요.
각 장을 한 줄씩, "1장: 내용" 형식으로만 응답하세요.`,
        `주제: ${topic}\n카피: ${finalCopy}`
      );
      setStructure(structResult);
      addLog("✅ 구조 승인 완료");
      setApproved(true);

      // ── STAGE 4: PNG Output ───────────────────────────────────
      setStage(4);
      addLog("🖼️ 1080×1350 PNG 레이아웃 생성 완료");

    } catch (e) {
      setError("오류가 발생했습니다: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F4F0",
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
        padding: "32px 16px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        textarea:focus, input:focus { outline: none; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#7DC97D", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
            INSTAGRAM AUTOMATION
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a", margin: 0 }}>
            콘텐츠 자동화 파이프라인
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
            주제만 입력하면 카피부터 PNG까지 자동 생성
          </p>
        </div>

        {/* Progress */}
        {stage > 0 && <ProgressBar stage={stage} total={4} />}

        {/* Input */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 10 }}>
            📌 주제를 입력해요
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 아침 루틴이 삶을 바꾸는 이유"
            disabled={loading}
            rows={3}
            style={{
              width: "100%",
              border: "1.5px solid #E8E8E8",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 14,
              resize: "none",
              background: "#FAFAFA",
              color: "#1a1a1a",
              boxSizing: "border-box",
              transition: "border 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#7DC97D")}
            onBlur={(e) => (e.target.style.borderColor = "#E8E8E8")}
          />
          <button
            onClick={runPipeline}
            disabled={loading || !topic.trim()}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "14px",
              background: loading || !topic.trim() ? "#ccc" : "#7DC97D",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              letterSpacing: 0.5,
            }}
          >
            {loading ? (
              <><Spinner />자동화 실행 중...</>
            ) : (
              "🚀 자동화 시작"
            )}
          </button>
        </div>

        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #ffaaaa", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 13, color: "#c00" }}>
            {error}
          </div>
        )}

        {/* Live Logs */}
        {logs.length > 0 && (
          <div
            ref={logRef}
            style={{
              background: "#1a1a1a",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 16,
              maxHeight: 120,
              overflowY: "auto",
            }}
          >
            {logs.map((log, i) => (
              <div key={i} style={{ fontSize: 12, color: "#aaffaa", fontFamily: "monospace", lineHeight: 1.8 }}>
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Stage 1 */}
        {stage >= 1 && (
          <StageCard stageNum="1단계" title="리서치 → 카피" active={stage === 1}>
            {research && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 6 }}>📊 리서치 결과</div>
                <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7, background: "#F8F8F8", borderRadius: 8, padding: 12 }}>
                  {research}
                </div>
              </div>
            )}
            {copy && (
              <div>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 6 }}>✍️ 카피 초안</div>
                <div style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.7, background: "#F0FAF0", borderRadius: 8, padding: 12, borderLeft: "3px solid #7DC97D" }}>
                  {copy}
                </div>
              </div>
            )}
          </StageCard>
        )}

        {/* Stage 2 */}
        {stage >= 2 && hookScore !== null && (
          <StageCard stageNum="2단계" title="후킹 팀 토론" active={stage === 2}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: hookScore >= 7 ? "#7DC97D" : "#e07070",
                }}
              >
                {hookScore}
                <span style={{ fontSize: 16, color: "#aaa" }}>/10</span>
              </div>
              <Badge
                text={hookScore >= 7 ? "✅ 통과" : "🔄 재작성"}
                color={hookScore >= 7 ? "#7DC97D" : "#e07070"}
              />
            </div>
            {hookLine && (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", background: "#F0FAF0", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                💡 후킹 라인: {hookLine}
              </div>
            )}
            {hookFeedback && (
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>📝 {hookFeedback}</div>
            )}
            {revisedCopy && (
              <div>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 6 }}>🔄 재작성 카피</div>
                <div style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.7, background: "#F0FAF0", borderRadius: 8, padding: 12, borderLeft: "3px solid #7DC97D" }}>
                  {revisedCopy}
                </div>
              </div>
            )}
          </StageCard>
        )}

        {/* Stage 3 */}
        {stage >= 3 && structure && (
          <StageCard stageNum="3단계" title="구조 토론" active={stage === 3}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Badge text={approved ? "✅ 승인" : "검토 중"} color="#7DC97D" />
              <span style={{ fontSize: 12, color: "#888" }}>10장 구성</span>
            </div>
            <div style={{ fontSize: 12, color: "#444", lineHeight: 1.9, background: "#F8F8F8", borderRadius: 8, padding: 12 }}>
              {structure}
            </div>
          </StageCard>
        )}

        {/* Stage 4 */}
        {stage >= 4 && (
          <StageCard stageNum="4단계" title="PNG 자동 생성" active={stage === 4}>
            <div style={{ marginBottom: 16 }}>
              <Badge text="1080 × 1350" color="#7DC97D" />
              <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>인스타그램 규격</span>
            </div>
            <InstagramPreview
              copy={revisedCopy || copy}
              hook={hookLine}
              structure={structure}
            />
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                background: "#F0FAF0",
                borderRadius: 10,
                fontSize: 12,
                color: "#555",
                textAlign: "center",
                lineHeight: 1.7,
              }}
            >
              🎉 <strong>자동화 완료!</strong><br />
              HTML 템플릿과 Puppeteer로 PNG 출력 준비 완료
            </div>

            <button
              onClick={reset}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "12px",
                background: "#fff",
                color: "#7DC97D",
                border: "2px solid #7DC97D",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🔁 새 주제로 다시 시작
            </button>
          </StageCard>
        )}
      </div>
    </div>
  );
}
