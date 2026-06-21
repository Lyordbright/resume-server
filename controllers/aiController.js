import resumeModel from "../models/resumeModel.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const buildPrompt = ({ jobTitle, yearsExperience, industry, keySkills, achievements }) => `
You are a professional resume writer. Based on the details below, generate resume content.

Job title / role: ${jobTitle}
Years of experience: ${yearsExperience}
Industry: ${industry}
Key skills: ${keySkills}
Notable achievements or responsibilities: ${achievements}

Return ONLY valid JSON (no markdown, no code fences, no commentary) matching exactly this shape:

{
  "summary": "a punchy 2-3 sentence professional summary",
  "experience": [
    {
      "company": "a plausible placeholder company name like 'Previous Company'",
      "role": "${jobTitle}",
      "startDate": "",
      "endDate": "",
      "current": false,
      "description": "2-3 sentences describing responsibilities and achievements, written in first person resume style, action-verb led"
    }
  ],
  "skills": ["6 to 10 relevant skills as short strings, based on the key skills and industry given"]
}

Keep the JSON compact and valid. Do not include any text outside the JSON object.
`;

export const generateResumeContent = async (req, res, next) => {
  const { jobTitle, yearsExperience, industry, keySkills, achievements } = req.body;

  if (!jobTitle?.trim()) {
    return res.status(400).json({ status: "error", message: "Job title is required" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ status: "error", message: "AI service is not configured" });
  }

  try {
    const prompt = buildPrompt({
      jobTitle,
      yearsExperience: yearsExperience || "Not specified",
      industry: industry || "Not specified",
      keySkills: keySkills || "Not specified",
      achievements: achievements || "Not specified",
    });

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a professional resume writer. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq error:", errText);
      return res.status(502).json({ status: "error", message: "AI generation failed. Please try again." });
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || "";

    // Strip any accidental markdown code fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse Groq JSON:", cleaned);
      return res.status(502).json({ status: "error", message: "AI returned an unexpected format. Please try again." });
    }

    return res.status(200).json({
      status: "success",
      data: {
        summary: parsed.summary || "",
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Creates a new resume pre-filled with AI generated content
export const generateAndCreateResume = async (req, res, next) => {
  try {
    const { fullName, jobTitle, summary, experience, skills } = req.body;

    const resume = await resumeModel.create({
      user: req.user._id,
      title: jobTitle ? `${jobTitle} Resume` : "AI Generated Resume",
      content: {
        personalInfo: {
          fullName: fullName || "",
          email: req.user.email || "",
          phone: "",
          location: "",
          linkedin: "",
          portfolio: "",
          summary: summary || "",
        },
        experience: experience || [],
        education: [],
        skills: skills || [],
        certifications: [],
      },
    });

    return res.status(201).json({ status: "success", data: resume });
  } catch (error) {
    next(error);
  }
};