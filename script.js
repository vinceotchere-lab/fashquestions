let dataset = [];
let progress = { score: 0, answers: {} };
let currentIndex = 0;

const headerEl = document.getElementById('header');
const mainEl = document.getElementById('main');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const summaryEl = document.getElementById('summary');
const scoreDisplay = document.getElementById('scoreDisplay');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progress-bar');

// UI helpers
function showError(msg, extra='') {
  errorEl.innerHTML = `<strong>Dataset load failed.</strong><br/>${msg}${extra?'<br/>'+extra:''}`;
  errorEl.style.display = 'block';
  loadingEl.style.display = 'none';
}
function updateProgress() {
  const total = dataset.length;
  const answered = Object.keys(progress.answers).length;
  scoreDisplay.textContent = `Score: ${progress.score}`;
  progressText.textContent = `Progress: ${answered}/${total}`;
  progressBar.style.width = `${(answered/total)*100}%`;
}

// Quiz
function showQuestion(index) {
  currentIndex = index;
  const q = dataset[index];
  questionEl.textContent = `Q${index+1}. ${q.question}`;
  optionsEl.innerHTML = '';
  q.options.forEach((opt,i)=>{
    const btn = document.createElement('button');
    btn.textContent = opt;
    if (progress.answers[index] !== undefined) {
      const chosen = progress.answers[index];
      const correct = (typeof q.answer === 'number') ? q.answer : q.options.indexOf(q.answer);
      if (i === chosen && chosen === correct) { btn.classList.add('correct'); }
      else if (i === chosen && chosen !== correct) { btn.classList.add('wrong'); }
      if (i === correct && i !== chosen) { btn.classList.add('correct'); }
      btn.disabled = true;
    } else {
      btn.onclick = () => handleAnswer(i);
    }
    optionsEl.appendChild(btn);
  });
  prevBtn.disabled = (index === 0);
  nextBtn.textContent = (index === dataset.length-1) ? 'Finish' : 'Next';
  nextBtn.disabled = (progress.answers[index] === undefined);
  updateProgress();
}
function handleAnswer(i) {
  const q = dataset[currentIndex];
  const correct = (typeof q.answer === 'number') ? q.answer : q.options.indexOf(q.answer);
  progress.answers[currentIndex] = i;
  if (i === correct) progress.score++;
  showQuestion(currentIndex);
  nextBtn.disabled = false;
}
function showSummary() {
  summaryEl.innerHTML = `<h2>Quiz Completed!</h2><p>Your score: ${progress.score} / ${dataset.length}</p>`;
  document.getElementById('card').style.display='none';
  summaryEl.style.display='block';
}

// Router
function wireRouting() {
  window.addEventListener('hashchange', ()=>{
    const n = parseInt(location.hash.replace('#',''));
    if (!isNaN(n) && n>=1 && n<=dataset.length) showQuestion(n-1);
    if (location.hash === '#complete') showSummary();
  });
  prevBtn.onclick = ()=>{ if (currentIndex>0) location.hash = String(currentIndex); };
  nextBtn.onclick = ()=>{ if (currentIndex<dataset.length-1) location.hash = String(currentIndex+2); else location.hash='complete'; };
}

// Boot
const url = 'dataset.json?cb=' + Date.now(); // cache-bust
fetch(url, { cache: 'no-store' })
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status} for dataset.json`); return r.json(); })
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) throw new Error('dataset.json is empty or invalid');
    dataset = data;
    loadingEl.style.display = 'none';
    headerEl.style.display = 'block';
    mainEl.style.display = 'block';

    // Start where you left off (optional)
    const answered = Object.keys(progress.answers).length;
    if (answered > 0 && answered < dataset.length) {
      let next = 0; while (progress.answers[next] !== undefined && next < dataset.length) next++;
      location.hash = String(next+1);
    } else {
      location.hash = '1';
    }
    wireRouting();

    // Diagnostics in console so you can verify it's YOUR data:
    console.log('Loaded dataset length:', dataset.length);
    console.log('First question:', dataset[0]?.question);
  })
  .catch(e => {
    const base = window.location.origin + window.location.pathname.replace(/\\/[^/]*$/, '/');
    const ds = base + 'dataset.json';
    showError(e.message, `Expected dataset at <code>${ds}</code>. Open it directly in your browser to confirm it shows your JSON (not [] / not 404).`);
    console.error(e);
  });
