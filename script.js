// ─────────────────────────────────────────────────────
//  SkillSync AI — Main Frontend Script (Corrected)
// ─────────────────────────────────────────────────────

const STATE = {
  userName: '',
  currentStep: 1,
  role: '',
  experience: '',
  currentRole: '',
  education: '',
  fieldOfStudy: '',
  skills: {},          // { skillName: proficiency }
  projects: [],
  analysisResult: null,
};

const SKILL_DATA = {
  Programming: ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'C#'],
  Frameworks:  ['React', 'Django', 'Spring Boot', 'Vue.js', 'Angular', 'FastAPI', 'Node.js', 'Express'],
  Data:        ['Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'SQL', 'Statistics', 'Tableau'],
  Tools:       ['Git', 'Docker', 'AWS', 'Linux', 'Kubernetes', 'Figma', 'Postman', 'Jira'],
  Other:       ['REST APIs', 'OOP', 'Data Structures', 'Algorithms', 'System Design', 'Agile', 'HTML', 'CSS'],
};

const ROLE_META = {
  'Software Engineer':           { emoji: '⚙️', desc: 'Build scalable software systems' },
  'AI Engineer':                 { emoji: '🤖', desc: 'Design & deploy AI/ML systems' },
  'Data Analyst':                { emoji: '📊', desc: 'Transform data into insights' },
  'Machine Learning Engineer':   { emoji: '🧠', desc: 'Build & scale ML pipelines' },
  'Frontend Developer':          { emoji: '🎨', desc: 'Craft stunning user interfaces' },
  'Backend Developer':           { emoji: '🔧', desc: 'Engineer robust server systems' },
};

let donutChart = null;
let activeCategory = 'Programming';

// ─── DOM HELPERS ────────────────────────────────────

const $ = id => document.getElementById(id);

const showScreen = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
};

function showToast(msg, type = '') {
  const t = $('toast');
  t.innerHTML = `<span>${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span> ${msg}`;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function showLoading(show) {
  $('loading-overlay').classList.toggle('active', show);
}

// ─── LOGIN ───────────────────────────────────────────

$('btn-get-started').addEventListener('click', () => {
  const name = $('input-name').value.trim();
  if (!name) { showToast('Please enter your name', 'error'); return; }
  STATE.userName = name;
  $('nav-username').textContent = name;
  $('nav-avatar-letter').textContent = name[0].toUpperCase();
  $('result-nav-name').textContent = name;
  $('result-avatar').textContent = name[0].toUpperCase();
  showScreen('steps-screen');
  goToStep(1);
});

$('input-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-get-started').click(); });

// ─── STEP NAVIGATION ─────────────────────────────────

function goToStep(n) {
  STATE.currentStep = n;
  document.querySelectorAll('.step-card').forEach(c => c.classList.remove('active'));
  const card = document.querySelector(`.step-card[data-step="${n}"]`);
  if (card) card.classList.add('active');
  updateProgress(n);
}

function updateProgress(step) {
  const fill = Math.round((step / 5) * 100);
  $('progress-fill').style.width = fill + '%';
  $('progress-label-text').textContent = `Step ${step} of 5`;

  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    const s = i + 1;
    dot.classList.remove('active', 'completed');
    if (s < step) dot.classList.add('completed');
    else if (s === step) dot.classList.add('active');
  });

  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('completed', i + 1 < step);
  });
}

// Step 1 → 2
$('btn-step1-next').addEventListener('click', () => {
  const role = $('input-current-role').value.trim();
  const exp  = $('input-experience').value;
  if (!role) { showToast('Please fill in your current role', 'error'); return; }
  STATE.currentRole = role;
  STATE.experience  = exp;
  goToStep(2);
});

// Step 2 → 1 / → 3
$('btn-step2-back').addEventListener('click', () => goToStep(1));
$('btn-step2-next').addEventListener('click', () => {
  const edu = $('input-education').value;
  const fos = $('input-field').value.trim();
  if (!edu || !fos) { showToast('Please complete education info', 'error'); return; }
  STATE.education    = edu;
  STATE.fieldOfStudy = fos;
  goToStep(3);
});

// Step 3 → 2 / → 4
$('btn-step3-back').addEventListener('click', () => goToStep(2));
$('btn-step3-next').addEventListener('click', () => {
  if (Object.keys(STATE.skills).length === 0) {
    showToast('Please select at least one skill', 'error');
    return;
  }
  goToStep(4);
  renderProjectCards();
});

// Step 4 → 3 / → 5
$('btn-step4-back').addEventListener('click', () => goToStep(3));
$('btn-step4-next').addEventListener('click', () => {
  collectProjects();
  goToStep(5);
  renderRoleCards();
});

// Step 5 → 4
$('btn-step5-back').addEventListener('click', () => goToStep(4));

// ─── SKILLS STEP ─────────────────────────────────────

function renderCategoryTabs() {
  const container = $('category-tabs');
  container.innerHTML = '';
  Object.keys(SKILL_DATA).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-tab' + (cat === activeCategory ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      activeCategory = cat;
      document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSkillTags();
    };
    container.appendChild(btn);
  });
}

function renderSkillTags() {
  const grid = $('skills-grid');
  grid.innerHTML = '';
  (SKILL_DATA[activeCategory] || []).forEach(skill => {
    const tag = document.createElement('div');
    const selected = STATE.skills.hasOwnProperty(skill);
    tag.className = 'skill-tag' + (selected ? ' selected' : '');
    tag.innerHTML = `<span class="check">✓</span> ${skill}`;
    tag.onclick = () => toggleSkill(skill, tag);
    grid.appendChild(tag);
  });
}

function toggleSkill(skill, el) {
  if (STATE.skills.hasOwnProperty(skill)) {
    delete STATE.skills[skill];
    el.classList.remove('selected');
  } else {
    STATE.skills[skill] = 5;
    el.classList.add('selected');
  }
  renderProficiencySliders();
}

function renderProficiencySliders() {
  const container = $('proficiency-list');
  container.innerHTML = '';

  const skills = Object.keys(STATE.skills);
  if (skills.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-muted);text-align:center;padding:12px 0">Select skills above to set proficiency</p>';
    return;
  }

  skills.forEach(skill => {
    const prof = STATE.skills[skill];
    let badge = 'beginner', badgeText = 'Beginner';
    if (prof >= 7) { badge = 'expert'; badgeText = 'Expert'; }
    else if (prof >= 4) { badge = 'mid'; badgeText = 'Intermediate'; }

    // FIX: Use a safe ID that handles all special characters
    const safeId = skill.replace(/[^a-zA-Z0-9]/g, '-');

    const row = document.createElement('div');
    row.className = 'proficiency-item';
    row.innerHTML = `
      <span class="prof-name">${skill}</span>
      <input type="range" class="prof-slider" min="1" max="10" value="${prof}" data-skill="${skill}">
      <span class="prof-value" id="pv-${safeId}">${prof}</span>
      <span class="prof-badge ${badge}" id="pb-${safeId}">${badgeText}</span>
    `;
    container.appendChild(row);

    const slider = row.querySelector('.prof-slider');
    slider.addEventListener('input', e => {
      const v = parseInt(e.target.value);
      STATE.skills[skill] = v;
      $(`pv-${safeId}`).textContent = v;
      const pb = $(`pb-${safeId}`);
      if (v >= 7) { pb.className = 'prof-badge expert'; pb.textContent = 'Expert'; }
      else if (v >= 4) { pb.className = 'prof-badge mid'; pb.textContent = 'Intermediate'; }
      else { pb.className = 'prof-badge beginner'; pb.textContent = 'Beginner'; }
    });
  });
}

renderCategoryTabs();
renderSkillTags();
renderProficiencySliders();

// ─── PROJECTS STEP ───────────────────────────────────

// FIX: Removed unused projectCount variable. Use DOM-based numbering only.

function renderProjectCards() {
  const container = $('projects-list');
  // Only add the first card if the list is empty
  if (container.children.length === 0) {
    addProjectCard();
  }
}

function addProjectCard() {
  const container = $('projects-list');
  const cardNumber = container.children.length + 1;
  const idx = Date.now();

  const card = document.createElement('div');
  card.className = 'project-card';
  card.dataset.id = idx;
  card.innerHTML = `
    <div class="project-card-header">
      <span class="project-num">Project #${cardNumber}</span>
      <button class="btn-remove-project" onclick="removeProject(this)">✕</button>
    </div>
    <div class="form-group">
      <label>Project Name</label>
      <input type="text" placeholder="e.g. E-commerce Platform" class="project-name">
    </div>
    <div class="form-group">
      <label>Technologies Used</label>
      <input type="text" placeholder="e.g. React, Node.js, MongoDB" class="project-tech">
    </div>
  `;
  container.appendChild(card);
}

// FIX: Removed unused id parameter — just use closest() to find and remove the card
function removeProject(btn) {
  const card = btn.closest('.project-card');
  card.remove();
  renumberProjects();
}

function renumberProjects() {
  document.querySelectorAll('.project-num').forEach((el, i) => {
    el.textContent = `Project #${i + 1}`;
  });
}

function collectProjects() {
  STATE.projects = [];
  document.querySelectorAll('.project-card').forEach(card => {
    const name = card.querySelector('.project-name').value.trim();
    const tech = card.querySelector('.project-tech').value.trim();
    if (name) STATE.projects.push({ name, tech });
  });
}

$('btn-add-project').addEventListener('click', addProjectCard);

// ─── ROLE CARDS ──────────────────────────────────────

// FIX: Removed unused rolesData parameter from function signature
function renderRoleCards() {
  const grid = $('roles-grid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:13px;padding:20px">Loading roles…</div>';

  fetch('/roles')
    .then(r => r.json())
    .then(roles => {
      grid.innerHTML = '';
      roles.forEach(role => {
        const meta = ROLE_META[role.name] || { emoji: '💼', desc: role.description };
        const card = document.createElement('div');
        card.className = 'role-card' + (STATE.role === role.name ? ' selected' : '');
        card.innerHTML = `
          <span class="role-emoji">${meta.emoji}</span>
          <div class="role-title">${role.name}</div>
          <div class="role-desc">${meta.desc}</div>
          <div class="role-skills-preview">
            ${role.key_skills.map(s => `<span class="role-skill-pill">${s}</span>`).join('')}
          </div>
        `;
        card.onclick = () => selectRole(role.name, card);
        grid.appendChild(card);
      });
    })
    .catch(() => {
      // Fallback: render from local ROLE_META data
      grid.innerHTML = '';
      Object.entries(ROLE_META).forEach(([name, meta]) => {
        const card = document.createElement('div');
        card.className = 'role-card' + (STATE.role === name ? ' selected' : '');
        card.innerHTML = `
          <span class="role-emoji">${meta.emoji}</span>
          <div class="role-title">${name}</div>
          <div class="role-desc">${meta.desc}</div>
        `;
        card.onclick = () => selectRole(name, card);
        grid.appendChild(card);
      });
    });
}

function selectRole(name, cardEl) {
  STATE.role = name;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');
  const bar = $('floating-bar');
  $('selected-role-name').textContent = name;
  bar.classList.add('visible');
}

$('btn-analyze-now').addEventListener('click', runAnalysis);

// ─── ANALYSIS ────────────────────────────────────────

async function runAnalysis() {
  if (!STATE.role) { showToast('Please select a target role', 'error'); return; }

  showLoading(true);
  $('btn-analyze-now').classList.add('loading');

  const skillsPayload = Object.entries(STATE.skills).map(([name, proficiency]) => ({
    name, proficiency
  }));

  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: STATE.userName,
        role: STATE.role,
        skills: skillsPayload,
        projects: STATE.projects.length,
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    STATE.analysisResult = data;
    showLoading(false);
    showAnalysis(data);

  } catch (err) {
    showLoading(false);
    showToast('Analysis failed: ' + err.message, 'error');
  }

  $('btn-analyze-now').classList.remove('loading');
}

function showAnalysis(data) {
  $('floating-bar').classList.remove('visible');
  showScreen('analysis-screen');

  $('analysis-user-name').textContent = STATE.userName;
  $('analysis-role-name').textContent = STATE.role;

  // Donut chart
  renderDonutChart(data.match);

  // Readiness
  renderReadiness(data.readiness, data.match);

  // Skills breakdown
  renderSkillsBreakdown(data.matched_skills, data.missing);

  // Roadmap
  renderRoadmap(data.roadmap);
}

function renderDonutChart(match) {
  const ctx = $('donut-chart').getContext('2d');
  const remaining = Math.max(0, 100 - match);

  // Color based on score
  let color = '#ef4444';
  if (match >= 75) color = '#10b981';
  else if (match >= 50) color = '#f59e0b';

  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [match, remaining],
        backgroundColor: [color, '#e2e8f0'],
        borderWidth: 0,
        hoverOffset: 4,
      }]
    },
    options: {
      cutout: '72%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 1000, easing: 'easeInOutQuart' }
    }
  });

  // Animate counter
  let start = null;
  const end = match;
  const duration = 1000;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    $('match-value').textContent = Math.round(progress * end) + '%';
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderReadiness(level, match) {
  const ring    = $('readiness-ring');
  const icon    = $('readiness-icon');
  const levelEl = $('readiness-level-text');
  const desc    = $('readiness-desc');

  ring.className    = 'readiness-ring ' + level.toLowerCase();
  levelEl.className = 'readiness-level ' + level.toLowerCase();
  levelEl.textContent = level;

  if (level === 'High') {
    icon.textContent = '🚀';
    desc.textContent = "You're job-ready! Apply with confidence.";
  } else if (level === 'Moderate') {
    icon.textContent = '⚡';
    desc.textContent = 'Close! Bridge a few gaps to stand out.';
  } else {
    icon.textContent = '📚';
    desc.textContent = 'Focus on the roadmap to level up fast.';
  }
}

function renderSkillsBreakdown(matched, missing) {
  const matchedList = $('matched-list');
  const missingList = $('missing-list');

  matchedList.innerHTML = matched.length
    ? matched.map(s =>
        `<span class="skill-result-pill matched">✓ ${s.name}
          <small style="opacity:.7">${s.proficiency}/10</small>
        </span>`
      ).join('')
    : '<span style="color:var(--text-muted);font-size:13px">No matched skills</span>';

  missingList.innerHTML = missing.length
    ? missing.map(s =>
        `<span class="skill-result-pill missing">✗ ${s}</span>`
      ).join('')
    : '<span style="color:var(--success);font-size:13px">🎉 No gaps found!</span>';

  $('match-stats').textContent = `${matched.length} matched · ${missing.length} missing`;
}

function renderRoadmap(roadmap) {
  const timeline = $('roadmap-timeline');
  timeline.innerHTML = '';

  roadmap.forEach(item => {
    const div = document.createElement('div');
    div.className = 'roadmap-item' + (item.priority === 'high' ? ' priority' : '');
    div.innerHTML = `
      <div class="roadmap-dot"></div>
      <div class="roadmap-week">${item.week}</div>
      <div class="roadmap-task">
        ${item.task}
        ${item.priority === 'high' ? '<span class="priority-badge">🔥 Priority</span>' : ''}
      </div>
    `;
    timeline.appendChild(div);
  });
}

// ─── RESTART ─────────────────────────────────────────

$('btn-restart').addEventListener('click', () => {
  Object.assign(STATE, {
    userName: '', currentStep: 1, role: '', experience: '',
    currentRole: '', education: '', fieldOfStudy: '',
    skills: {}, projects: [], analysisResult: null,
  });

  // Clear inputs
  ['input-name', 'input-current-role', 'input-experience', 'input-field'].forEach(id => {
    const el = $(id);
    if (el) el.value = '';
  });

  const eduEl = $('input-education');
  if (eduEl) eduEl.selectedIndex = 0;

  $('projects-list').innerHTML = '';

  activeCategory = 'Programming';
  renderCategoryTabs();
  renderSkillTags();
  renderProficiencySliders();

  if (donutChart) { donutChart.destroy(); donutChart = null; }

  showScreen('login-screen');
  showToast('Ready for a fresh start!', 'success');
});

// ─── INIT ─────────────────────────────────────────────
showScreen('login-screen');
