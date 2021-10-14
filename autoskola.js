// Code to get all current questions
const loopCount = 10000;

// Ziskat 25 otazek
function getQuestions() {
    let questions = [];
    $.ajax({
        url: basePath + "Test/GenerateTest",
        type: "POST",
        data: { testTypeExamID: $("#testTypeExamID").val() },
        async: false,
        success: function(data) {
            questions = data;
        },
    });
    return {
        questions: questions.Questions,
        BracketScopes: questions.BasketScopes,
    };
}

// Dostat otazku podle QuestionID
function getQuestionHtmlByID(questionId) {
    let ans = null;
    $.ajax({
        url: basePath + "Test/RenderQuestion",
        type: "POST",
        data: { id: questionId },
        async: false,
        success: function(data) {
            ans = data;
        },
    });
    return ans;
}

function dataFromHtmlQuestion(html) {
    let question = {};
    let div = document.createElement("div");
    document.body.appendChild(div);
    div.innerHTML = html;

    let media =
        div.querySelector(".image-frame video") ||
        div.querySelector(".image-frame img");
    if (!media) {
        question.text = div
            .querySelector(".image-frame .question-text")
            .innerText.replaceAll("\n", "");
        question.mediaSrc = null;
    } else {
        question.text = div
            .querySelector(".question-text")
            .innerText.replaceAll("\n", "");
        question.mediaSrc = "https://etesty2.mdcr.cz" + media.src;

        let source = media.querySelector("source");
        if (source) {
            media = source;
        }
        question.mediaSrc = media.src;
    }

    let answers = div.querySelectorAll(".answer-container .answer");
    question.answers = [];
    for (let item of answers) {
        let text = item.innerText.replaceAll("\n", "");
        text = text.slice(0, 1) + " " + text.slice(1);
        let id = Number(item.getAttribute("data-answerid"));
        question.answers.push({ text: text, id: id });
    }

    document.body.removeChild(div);
    return question;
}

function getCorrectAnswerFromId(questionId, answeredIDs) {
    let res = "";
    $.ajax({
        url: basePath + "Test/QuestionPreview",
        type: "POST",
        data: { questionID: questionId, answeredIDs: answeredIDs },
        async: false,
        traditional: true,
        success: function(data) {
            res = data;
        },
    });

    let div = document.createElement("div");
    document.body.appendChild(div);
    div.innerHTML = res;
    let ansData = [];
    let ansEls = Array.from(
        div.querySelectorAll(".CorrectAnswer, .IncorrectAnswer")
    );
    for (let item of ansEls) {
        ansData.push({
            id: Number(item.getAttribute("data-answerid")),
            correct: item.getAttribute("data-correct") == "True",
        });
    }

    document.body.removeChild(div);
    return ansData;
}

let questions = [];
let BasketScopes = (await getQuestions()).BracketScopes;
console.log(BasketScopes);

for (let i = 0; i < loopCount; i++) {
    let qs = (await getQuestions()).questions;
    for (let item of qs) {
        questions.push(item);
    }
    console.clear();
    console.log(questions.length / 25);
}

questions.sort((a, b) => {
    return a.QuestionID - b.QuestionID;
});

console.log("Clearing Duplicates " + "\n" + (new Date));
let seen = [];
let newArr = [];
for (let item of questions) {
    if (seen.includes(item.QuestionID)) continue;
    newArr.push(item);
    seen.push(item.QuestionID);
}
questions = newArr;

console.log("Extracting Data " + "\n" + (new Date))
let questionsData = [];
for (let question of questions) {
    const questionId = question.QuestionID;
    let html = getQuestionHtmlByID(questionId);
    if (html == "" || html == null) continue;
    let questionData = dataFromHtmlQuestion(html);
    questionData.QuestionID = questionId;
    questionData.html = html;
    questionsData.push({...questionData, ...question });
}

console.log("Getting Correct Answers " + "\n" + (new Date))
for (let item of questionsData) {
    let answers = getCorrectAnswerFromId(item.QuestionID, item.answers[0].id);
    for (let ans of answers) {
        item.answers.find((e) => {
            return e.id == ans.id;
        }).correct = ans.correct;
    }

    item.BasketScope = BasketScopes.find((e) => {
        return e.BasketScopeID == item.BasketScopeID;
    }).Text;
}

console.clear();
console.log("Basket Scope Data:")
console.log(JSON.stringify(BasketScopes));
console.log("Question Data:");
console.log(JSON.stringify(questionsData));
console.log(`Total: ${questionsData.length} questions`)