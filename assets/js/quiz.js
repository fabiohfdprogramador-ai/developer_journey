function answerQuiz(exerciseId, userChoice, isCorrect, explanation) {
  const answerBox = document.getElementById(`ans-${exerciseId}`);

  if (userChoice === isCorrect) {
    answerBox.className = "answer-box visible correct";
    answerBox.innerHTML = `<strong>✓ CORRETO! (Verdadeiro)</strong><br>${explanation}`;
  } else {
    answerBox.className = "answer-box visible incorrect";
    answerBox.innerHTML = `<strong>× INCORRETO! (Gabarito: ${isCorrect ? "VERDADEIRO" : "FALSO"})</strong><br>${explanation}`;
  }
}

function toggleAnswer(exerciseId) {
  const answerBox = document.getElementById(`ans-${exerciseId}`);
  if (answerBox.classList.contains("visible")) {
    answerBox.classList.remove("visible");
  } else {
    answerBox.classList.add("visible");
  }
}
