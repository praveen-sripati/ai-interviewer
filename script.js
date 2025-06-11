document.addEventListener('DOMContentLoaded', () => {
  // --- 1. DOM ELEMENT SELECTION ---
  const screens = {
    setup: document.getElementById('setup-screen'),
    interview: document.getElementById('interview-screen'),
    loading: document.getElementById('loading-screen'),
    completion: document.getElementById('completion-screen'),
  };
  const buttons = {
    start: document.getElementById('start-btn'),
    next: document.getElementById('next-btn'),
    restart: document.getElementById('restart-btn'),
  };
  const inputs = {
    topic: document.getElementById('topic-input'),
    answer: document.getElementById('answer-input'),
  };
  const display = {
    currentQuestionNum: document.getElementById('current-question-num'),
    totalQuestions: document.getElementById('total-questions'),
    questionText: document.getElementById('question-text'),
    loadingText: document.getElementById('loading-text'),
    feedbackContent: document.getElementById('feedback-content'),
  };

  // --- 2. STATE MANAGEMENT & CONSTANTS ---
  let questions = [];
  let interviewData = [];
  let currentQuestionIndex = 0;
  let interviewTopic = '';
  const API_BASE_URL = 'http://127.0.0.1:3000';
  const GENERATE_ENDPOINT = `${API_BASE_URL}/generate-questions`;
  const ANALYZE_ENDPOINT = `${API_BASE_URL}/analyze-answers`;

  // --- 3. SCREEN TRANSITION LOGIC ---
  function switchScreen(screenId) {
    const currentActiveScreen = document.querySelector('.screen.active');
    const newActiveScreen = document.getElementById(screenId);
    if (currentActiveScreen) {
      currentActiveScreen.classList.add('exiting');
      currentActiveScreen.addEventListener(
        'animationend',
        () => {
          currentActiveScreen.classList.remove('active', 'exiting');
          newActiveScreen.classList.add('active');
        },
        { once: true }
      );
    } else {
      newActiveScreen.classList.add('active');
    }
  }

  // --- 4. CORE APPLICATION LOGIC ---
  async function startInterview() {
    interviewTopic = inputs.topic.value.trim();
    if (!interviewTopic) {
      alert('Please enter a topic to begin.');
      return;
    }
    buttons.start.disabled = true;
    display.loadingText.textContent = 'Generating your questions...';
    switchScreen('loading-screen');
    try {
      const response = await fetch(GENERATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: interviewTopic }),
      });
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
      questions = await response.json();
      display.totalQuestions.textContent = questions.length;
      displayQuestion();
      switchScreen('interview-screen');
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      alert('Could not start the interview. Please ensure the backend server is running and accessible.');
      switchScreen('setup-screen');
    } finally {
      buttons.start.disabled = false;
    }
  }

  function displayQuestion() {
    inputs.answer.value = '';
    display.currentQuestionNum.textContent = currentQuestionIndex + 1;
    display.questionText.textContent = questions[currentQuestionIndex];
    inputs.answer.focus();
  }

  function handleNextQuestion() {
    const answer = inputs.answer.value.trim();
    if (answer === '') {
      alert('Please provide an answer.');
      return;
    }
    interviewData.push({ question: questions[currentQuestionIndex], answer: answer });
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      displayQuestion();
    } else {
      finishInterview();
    }
  }

  async function finishInterview() {
    display.loadingText.textContent = 'Analyzing your performance...';
    switchScreen('loading-screen');
    try {
      const response = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: interviewTopic, qa_list: interviewData }),
      });
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);

      const result = await response.json();

      // THIS IS THE FINAL, ROBUST PARSING AND VALIDATION LOGIC
      if (result && result.analysis && typeof result.analysis === 'string') {
        const cleanedHtml = result.analysis.replace(/^```html\s*|```$/g, "").trim();
        const parser = new DOMParser();
        const doc = parser.parseFromString(cleanedHtml.trim(), 'text/html');

        // Sanity Check: Does the AI response contain the HTML we actually want?
        if (doc.querySelector('.accordion-item') || doc.querySelector('.overall-summary')) {
          const desiredElements = doc.body.childNodes;
          display.feedbackContent.innerHTML = ''; // Clear previous content
          desiredElements.forEach((node) => {
            display.feedbackContent.appendChild(node.cloneNode(true));
          });
          setupAccordion();
        } else {
          // This block runs if the AI sends back garbage (like just ```html```)
          throw new Error('The AI returned an empty or invalid response.');
        }
      } else {
        throw new Error('Received invalid or empty analysis string from server.');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      display.feedbackContent.innerHTML = `<p class="error">Sorry, the AI was unable to provide feedback for this interview. Please try again with more detailed answers.</p>`;
    } finally {
      switchScreen('completion-screen');
    }
  }

  function restartInterview() {
    questions = [];
    interviewData = [];
    currentQuestionIndex = 0;
    interviewTopic = '';
    inputs.topic.value = '';
    inputs.answer.value = '';
    display.feedbackContent.innerHTML = '';
    switchScreen('setup-screen');
  }

  function setupAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach((header) => {
      header.addEventListener('click', () => {
        const accordionContent = header.nextElementSibling;
        const icon = header.querySelector('.accordion-icon');
        const isExpanded = header.getAttribute('aria-expanded') === 'true';

        header.classList.toggle('active');
        header.setAttribute('aria-expanded', !isExpanded);
        icon.textContent = isExpanded ? '+' : '−';

        if (!isExpanded) {
          accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        } else {
          accordionContent.style.maxHeight = '0px';
        }
      });
    });
  }

  // --- 5. EVENT LISTENERS ---
  buttons.start.addEventListener('click', startInterview);
  buttons.next.addEventListener('click', handleNextQuestion);
  buttons.restart.addEventListener('click', restartInterview);
  inputs.topic.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') buttons.start.click();
  });

  switchScreen('setup-screen');
});
