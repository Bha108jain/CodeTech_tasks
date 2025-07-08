let questions = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
const QUESTION_TIME = 10; // seconds
let timeLeft = QUESTION_TIME;
const answersSummary = [];

// decode HTML entities
function decodeHTML(html) {
  var txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// shuffle array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateProgress() {
  const progress = document.getElementById("progress");
  const percent = (currentIndex / questions.length) * 100;
  progress.style.width = `${percent}%`;
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = QUESTION_TIME;
  document.getElementById("timer").textContent = `⏳ Time left: ${timeLeft}s`;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = `⏳ Time left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitAnswer(true);
    }
  }, 1000);
}

function loadQuestion() {
  updateProgress();
  const q = questions[currentIndex];
  document.getElementById("question").textContent = `Q${
    currentIndex + 1
  }: ${decodeHTML(q.question)}`;
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.allOptions.forEach((opt) => {
    const div = document.createElement("div");
    div.classList.add("option");
    div.innerHTML = `<label><input type="radio" name="answer" value="${opt}"> ${opt}</label>`;
    optionsDiv.appendChild(div);
  });

  document.getElementById("feedback").textContent = "";
  startTimer();
}

function submitAnswer(auto = false) {
  clearInterval(timerInterval);
  const selected = document.querySelector('input[name="answer"]:checked');
  const feedback = document.getElementById("feedback");
  const correctAnswer = decodeHTML(questions[currentIndex].correct_answer);

  let chosenAnswer = selected ? selected.value : "No answer";

  if (!selected && !auto) {
    feedback.className = "wrong";
    feedback.textContent = "⚠️ Please select an answer!";
    startTimer(); // keep running if user didn’t pick and still within time
    return;
  }

  if (chosenAnswer === correctAnswer) {
    score++;
    feedback.className = "correct";
    feedback.textContent = "✅ Correct!";
  } else {
    feedback.className = "wrong";
    feedback.textContent = `❌ Wrong! Correct: ${correctAnswer}`;
  }

  answersSummary.push({
    question: decodeHTML(questions[currentIndex].question),
    correctAnswer: correctAnswer,
  });

  currentIndex++;
  setTimeout(() => {
    if (currentIndex < questions.length) {
      loadQuestion();
    } else {
      showResults();
    }
  }, 1500);
}

function showResults() {
  document.getElementById("quiz-container").innerHTML = `
    <h2>🎉 Quiz Completed!</h2>
    <p style="text-align:center;">Your Score: <strong>${score}/${
    questions.length
  }</strong></p>
    <h3>✅ Correct Answers:</h3>
    <ul>
      ${answersSummary
        .map(
          (q) =>
            `<li>${q.question}<br><strong>Answer:</strong> ${q.correctAnswer}</li>`
        )
        .join("")}
    </ul>
    <button onclick="location.reload()">Restart Quiz</button>
  `;
}

// fetch questions from API
fetch("https://opentdb.com/api.php?amount=10&type=multiple")
  .then((res) => res.json())
  .then((data) => {
    questions = data.results.map((q) => {
      const allOptions = shuffle([
        decodeHTML(q.correct_answer),
        ...q.incorrect_answers.map(decodeHTML),
      ]);
      return {
        ...q,
        allOptions,
      };
    });
    loadQuestion();
  })
  .catch((err) => {
    document.getElementById("quiz-container").innerHTML = `
      <h2>❌ Failed to load questions</h2>
      <p>Please check your internet connection and try again.</p>
      <button onclick="location.reload()">Retry</button>
    `;
    console.error(err);
  });
