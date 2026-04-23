from flask import Flask, request, jsonify, render_template
import sqlite3
import json
import os

app = Flask(__name__)
DATABASE = 'database.db'

# ─────────────────────────────────────────────
#  RULE-BASED EXPERT SYSTEM DATA
# ─────────────────────────────────────────────

ROLE_REQUIREMENTS = {
    "Software Engineer": {
        "description": "Build scalable software systems",
        "skills": ["Python", "Java", "JavaScript", "Data Structures", "Algorithms", "Git", "SQL", "REST APIs", "OOP"],
        "roadmap_template": [
            {"week": "Week 1–2", "task": "Master Data Structures & Algorithms"},
            {"week": "Week 3–4", "task": "Deep dive into OOP & Design Patterns"},
            {"week": "Week 5–6", "task": "Build REST APIs with Flask or Spring Boot"},
            {"week": "Week 7–8", "task": "Version control with Git & CI/CD basics"},
            {"week": "Week 9–10", "task": "SQL & Database design fundamentals"},
            {"week": "Week 11–12", "task": "Build a full-stack capstone project"},
        ]
    },
    "AI Engineer": {
        "description": "Design and deploy AI/ML systems",
        "skills": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "Data Structures", "Linear Algebra", "Git", "Docker", "REST APIs"],
        "roadmap_template": [
            {"week": "Week 1–2", "task": "Python for Data Science & NumPy/Pandas"},
            {"week": "Week 3–4", "task": "Core Machine Learning concepts & Scikit-learn"},
            {"week": "Week 5–6", "task": "Deep Learning with TensorFlow or PyTorch"},
            {"week": "Week 7–8", "task": "Model evaluation & hyperparameter tuning"},
            {"week": "Week 9–10", "task": "Deploy ML models with Flask + Docker"},
            {"week": "Week 11–12", "task": "Build an end-to-end AI project portfolio"},
        ]
    },
    "Data Analyst": {
        "description": "Transform data into business insights",
        "skills": ["Python", "SQL", "Excel", "Tableau", "Statistics", "Pandas", "Data Visualization", "Git"],
        "roadmap_template": [
            {"week": "Week 1–2", "task": "SQL fundamentals & complex queries"},
            {"week": "Week 3–4", "task": "Python with Pandas for data wrangling"},
            {"week": "Week 5–6", "task": "Statistics & probability foundations"},
            {"week": "Week 7–8", "task": "Data visualization with Tableau / Matplotlib"},
            {"week": "Week 9–10", "task": "Excel advanced techniques & pivot tables"},
            {"week": "Week 11–12", "task": "Complete an end-to-end analytics project"},
        ]
    },
    "Machine Learning Engineer": {
        "description": "Build and scale ML pipelines",
        "skills": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Docker", "AWS", "SQL", "Data Structures", "Git", "Statistics"],
        "roadmap_template": [
            {"week": "Week 1–2", "task": "ML fundamentals & Scikit-learn pipeline"},
            {"week": "Week 3–4", "task": "Feature engineering & model selection"},
            {"week": "Week 5–6", "task": "Deep Learning architectures (CNN, RNN, Transformers)"},
            {"week": "Week 7–8", "task": "MLOps: Docker, versioning & experiment tracking"},
            {"week": "Week 9–10", "task": "Cloud deployment: AWS SageMaker or GCP AI"},
            {"week": "Week 11–12", "task": "Build a production-grade ML system"},
        ]
    },
    "Frontend Developer": {
        "description": "Craft stunning user interfaces",
        "skills": ["JavaScript", "React", "HTML", "CSS", "TypeScript", "Git", "REST APIs", "Responsive Design", "Testing"],
        "roadmap_template": [
            {"week": "Week 1–2", "task": "HTML5 semantics & CSS3 advanced layouts"},
            {"week": "Week 3–4", "task": "JavaScript ES6+ & async programming"},
            {"week": "Week 5–6", "task": "React fundamentals: hooks, state, props"},
            {"week": "Week 7–8", "task": "TypeScript for type-safe React apps"},
            {"week": "Week 9–10", "task": "Testing with Jest & React Testing Library"},
            {"week": "Week 11–12", "task": "Build & deploy a polished React portfolio"},
        ]
    },
    "Backend Developer": {
        "description": "Engineer robust server systems",
        "skills": ["Python", "Java", "Django", "Spring Boot", "SQL", "REST APIs", "Docker", "Git", "Data Structures", "Algorithms"],
        "roadmap_template": [
            {"week": "Week 1–2", "task": "Backend architecture & REST API design"},
            {"week": "Week 3–4", "task": "Django or Spring Boot deep dive"},
            {"week": "Week 5–6", "task": "SQL & NoSQL database design"},
            {"week": "Week 7–8", "task": "Authentication, security & middleware"},
            {"week": "Week 9–10", "task": "Docker & containerized deployments"},
            {"week": "Week 11–12", "task": "Build a scalable microservices project"},
        ]
    }
}

# ─────────────────────────────────────────────
#  DATABASE SETUP
# ─────────────────────────────────────────────

def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            role TEXT,
            skills TEXT,
            projects INTEGER,
            match_score REAL,
            readiness TEXT,
            missing_skills TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# ─────────────────────────────────────────────
#  RULE-BASED EXPERT SYSTEM ENGINE
# ─────────────────────────────────────────────

def run_expert_system(role, user_skills_raw, projects_count):
    """
    Rule-Based Expert System for Skill Gap Analysis

    Rules:
    R1: IF user skill matches required skill → add base score
    R2: IF proficiency >= 7 → apply weight multiplier (1.5x)
    R3: IF proficiency 4–6 → apply partial weight (0.8x)
    R4: IF user has >= 2 projects → add 5% bonus
    R5: IF required skill missing → add to gap list
    """

    role_data = ROLE_REQUIREMENTS.get(role, {})
    required_skills = role_data.get("skills", [])
    roadmap_template = role_data.get("roadmap_template", [])

    if not required_skills:
        return {"error": "Role not found"}

    # Parse skills: {name: proficiency}
    user_skill_map = {}
    for item in user_skills_raw:
        name = item.get("name", "").strip()
        prof = int(item.get("proficiency", 5))
        if name:
            user_skill_map[name] = prof

    matched_skills = []
    missing_skills = []
    total_weight = len(required_skills)
    earned_weight = 0.0

    for skill in required_skills:
        if skill in user_skill_map:
            prof = user_skill_map[skill]
            # R2: High proficiency
            if prof >= 7:
                earned_weight += 1.5
            # R3: Medium proficiency
            elif prof >= 4:
                earned_weight += 0.8
            else:
                earned_weight += 0.4
            matched_skills.append({"name": skill, "proficiency": prof})
        else:
            # R5: Missing skill
            missing_skills.append(skill)

    # R4: Project bonus
    project_bonus = 5.0 if projects_count >= 2 else 0.0

    # Calculate match percentage (cap at 100)
    base_match = (earned_weight / (total_weight * 1.5)) * 100
    match_score = min(round(base_match + project_bonus, 1), 100.0)

    # Readiness level rules
    if match_score >= 75:
        readiness = "High"
    elif match_score >= 50:
        readiness = "Moderate"
    else:
        readiness = "Low"

    # Generate targeted roadmap (prioritize missing skills)
    roadmap = []
    missing_set = set(missing_skills)

    for step in roadmap_template:
        task_text = step["task"]
        # Check if this roadmap step addresses a missing skill
        relevant = any(s.lower() in task_text.lower() for s in missing_set)
        roadmap.append({
            "week": step["week"],
            "task": task_text,
            "priority": "high" if relevant else "normal"
        })

    # If more than 3 missing skills, add generic improvement step
    if len(missing_skills) > 3:
        roadmap.append({
            "week": "Ongoing",
            "task": f"Close gaps in: {', '.join(missing_skills[:4])}",
            "priority": "high"
        })

    return {
        "match": match_score,
        "readiness": readiness,
        "matched_skills": matched_skills,
        "missing": missing_skills,
        "roadmap": roadmap,
        "total_required": len(required_skills),
        "total_matched": len(matched_skills)
    }

# ─────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    role     = data.get("role", "").strip()
    skills   = data.get("skills", [])
    projects = int(data.get("projects", 0))
    name     = data.get("name", "Student").strip() or "Student"

    # Validate required fields
    if not role:
        return jsonify({"error": "Role is required"}), 400

    # Ensure skills is a list
    if not isinstance(skills, list):
        return jsonify({"error": "Skills must be a list"}), 400

    result = run_expert_system(role, skills, projects)

    if "error" in result:
        return jsonify(result), 400

    # Save to database
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()

        # FIX: Guard against empty skills list before accessing skills[0]
        if skills and isinstance(skills[0], dict):
            skills_json = json.dumps([s["name"] for s in skills])
        else:
            skills_json = json.dumps(skills)

        c.execute('''
            INSERT INTO analyses (name, role, skills, projects, match_score, readiness, missing_skills)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            name,
            role,
            skills_json,
            projects,
            result["match"],
            result["readiness"],
            json.dumps(result["missing"])
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB error: {e}")

    return jsonify(result)

@app.route('/roles', methods=['GET'])
def get_roles():
    roles = []
    for name, data in ROLE_REQUIREMENTS.items():
        roles.append({
            "name": name,
            "description": data["description"],
            "key_skills": data["skills"][:5]
        })
    return jsonify(roles)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
