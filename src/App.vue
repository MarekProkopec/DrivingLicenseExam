<template>
  <div class="app" v-if="json != null">
    <div
      class="previousAnswer"
      :class="answered[selectedPage].correct ? 'Correct' : 'Wrong'"
    >
      Answered:
      <span>
        {{ answered[selectedPage].correct ? "Correct" : "Wrong" }}
      </span>
    </div>
    <div class="question" v-html="json[selectedPage].html" ref="question"></div>

    <div class="bottomInput">
      <div class="page">
        <input
          type="number"
          v-model="selectedPage"
          :max="json.length - 1"
          min="0"
          step="1"
          @change="loadImages()"
        />
        / {{ json.length - 1 }}
      </div>
      <div class="inputContainer">
        <div class="pair">
          <button :disabled="selectedPage < 1" @click="previousQuestion()">
            &larr; Previous
          </button>
          <button
            :disabled="selectedPage > json.length - 2"
            @click="nextQuestion()"
          >
            Next &rarr;
          </button>
        </div>
        <div class="pair">
          <button @click="getFirstWrongAnswer()">
            Wrong Answer
          </button>
          <button @click="getRandomQuestion()">
            Random
          </button>
        </div>
      </div>
    </div>
    <div class="basketScopes">
      <div
        class="basket"
        v-for="(item, index) in basketScopes"
        :key="index"
        :class="
          item.BasketScopeID == json[selectedPage].BasketScopeID
            ? 'selected'
            : ''
        "
        @click="gotoPage(item.startPage)"
      >
        <p class="text">
          {{ item.Text }}
        </p>
        <p class="count">Count: {{ item.count }}</p>
      </div>
    </div>
  </div>
  <div v-else>
    Loading Data...
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      json: null,
      basketScopes: null,
      selectedPage: 0,
      answered: [],
    };
  },
  methods: {
    previousQuestion() {
      if (this.selectedPage <= 0) return;

      this.selectedPage--;
      this.loadImages();
    },
    getBasketCount(basket) {
      const id = basket.BasketScopeID;
      return this.json.filter((e) => {
        return e.BasketScopeID == id;
      }).length;
    },
    nextQuestion() {
      if (this.selectedPage >= this.json.length) return;
      this.selectedPage++;
      this.loadImages();
    },
    loadImages() {
      setTimeout(() => {
        const q = this.$refs.question;
        for (const ans of Array.from(q.querySelectorAll(".answer"))) {
          ans.onclick = () => {
            for (const target of Array.from(q.querySelectorAll(".answer"))) {
              this.correctAnswer(target, ans);
            }
          };
        }

        for (let img of Array.from(q.querySelectorAll("img, source"))) {
          img.src = img.src.replace(
            window.location.origin,
            "https://etesty2.mdcr.cz/"
          );
        }

        let video = q.querySelector("video");
        if (video) {
          let vid = document.createElement("video");
          vid.autoplay = true;
          vid.loop = true;
          vid.controls = true;

          let src = document.createElement("source");
          src.src = q.querySelector("source").src;
          vid.appendChild(src);
          q.querySelector(".image-frame").replaceChild(vid, video);
        }
      }, 10);
    },
    saveLocal() {
      localStorage.setItem("Answers", JSON.stringify(this.answered));
    },
    getAnswers() {
      if (localStorage.getItem("Answers") != null) {
        this.answered = JSON.parse(localStorage.getItem("Answers"));
        this.getFirstWrongAnswer();
        return;
      }

      this.answered = [];
      for (let i = 0; i < this.json.length; i++) {
        this.answered[i] = { correct: false };
      }
    },
    getFirstWrongAnswer() {
      for (let i = 0; i < this.answered.length; i++) {
        if (!this.answered[i].correct) {
          this.gotoPage(i);
          return;
        }
      }
    },
    correctAnswer(target, answer) {
      const sel = this.json[this.selectedPage];
      let id = Number(target.getAttribute("data-answerid"));

      const correct = sel.answers.find((e) => {
        return e.id == id;
      }).correct;

      if (correct) {
        target.classList.add("correct");
        if (answer == target) {
          this.answered[this.selectedPage].correct = true;
          this.saveLocal();
        }
      } else {
        target.classList.add("wrong");

        if (
          !sel.answers.find((e) => {
            return e.correct;
          })
        ) {
          this.answered[this.selectedPage].correct = true;
          this.saveLocal();
          alert("There was no correct answer");
        }
      }
    },
    handleKeybaord(e) {
      const kc = e.keyCode;
      const answers = Array.from(
        document.body.querySelectorAll(".answer-container .answer")
      );
      switch (kc) {
        case 37:
          this.previousQuestion();
          break;
        case 39:
          this.nextQuestion();
          break;
        case 49:
          answers[0].click();
          break;
        case 50:
          if (answers.length > 1) answers[1].click();
          break;
        case 51:
          if (answers.length > 2) answers[2].click();
          break;
        case 52:
          if (answers.length > 3) answers[3].click();
          break;

        default:
          break;
      }
    },
    start() {
      this.json.sort((a, b) => {
        return a.BasketScopeID - b.BasketScopeID;
      });

      let i = 0;
      for (let item of this.basketScopes) {
        item.count = this.getBasketCount(item);
        item.startPage = i;
        i += item.count;
      }
    },
    gotoPage(index) {
      this.selectedPage = index;
      this.loadImages();
    },
    getRandomQuestion() {
      let cur = this.selectedPage;
      while (cur == this.selectedPage) {
        this.gotoPage(Math.floor(Math.random() * this.json.length));
      }
    },
  },
  async created() {
    document.body.onkeydown = this.handleKeybaord;

    fetch("./BasketScopes.json")
      .then((response) => response.json())
      .then((data) => {
        this.basketScopes = data;
      });

    fetch("./otazky pouzivane.json")
      .then((response) => response.json())
      .then((data) => {
        this.json = data;
        this.loadImages();
        this.getAnswers();
        this.start();
      });
  },
};
</script>

<style lang="scss">
$wrongColor: #ff0000;
$correctColor: #81b214;

$backgroundColor: rgb(24, 25, 26);
$secondaryBackgorundColor: rgb(30, 30, 30);
$cardColor: rgb(36, 37, 38);
$hoverColor: #3a3b3c;
$primaryTextColor: #e5e6eb;
$secondaryTextColor: #b0b3b8;

* {
  margin: 0;
  padding: 0;
}

html,
body,
#app,
.app {
  height: 100vh;
  width: 100vw;
  overflow-y: auto;
}
.app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;

  display: grid;
  grid-template-rows: 5vh 78vh auto;

  padding: 20px;
  box-sizing: border-box;

  gap: 10px;

  background: $backgroundColor;
  color: $primaryTextColor;

  .previousAnswer {
    border: solid 3px black;
    padding: 5px;

    &.Correct {
      border-color: rgba($correctColor, 0.5);
      background: rgba($correctColor, 0.2);
    }
    &.Wrong {
      border-color: rgba($wrongColor, 0.5);
      background: rgba($wrongColor, 0.2);
    }

    span {
      font-weight: bold;
    }
  }

  .bottomInput {
    display: flex;
    flex-direction: column;
    align-items: center;

    input {
      width: 4em;
      padding: 0;
      outline: none;
      border: none;
      margin-bottom: 5px;
      background: transparent;
      color: $primaryTextColor;
    }

    .inputContainer {
      width: 100%;
      gap: 10px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-evenly;
      position: relative;

      .pair{
        display: flex;
        gap: 5px;
      }

      button {
        padding: 15px;
        width: fit-content;
        box-sizing: border-box;
        height: 100%;
        background: darken($hoverColor, 10%);
        color: $primaryTextColor;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        transition: 0.1s linear background;

        &:hover {
          background: $hoverColor;
        }
      }
    }
  }

  .question {
    padding: 0 5px;
    background: $secondaryBackgorundColor;
    overflow-y: auto;

    display: flex;
    flex-direction: column;
    justify-content: space-evenly;

    .question-text {
      font-weight: bold;
      margin: 5px 0;
    }

    .image-frame {
      height: 50%;

      & > div {
        height: 100%;
        width: auto;
        display: flex;
        position: relative;

        & > a {
          position: absolute;
          bottom: 0;
        }
      }
    }

    video,
    img {
      max-width: 100%;
      height: auto;
      max-height: 100%;
    }

    .answer-container {
      display: flex;
      flex-direction: column;

      .answer {
        display: flex;
        background: $cardColor;
        border-radius: 3px;
        box-sizing: border-box;
        align-items: center;
        margin: 5px;
        cursor: pointer;
        text-align: start;
        border: solid 2px transparent;

        transition: all 0.1s linear;

        &:hover {
          background: $hoverColor;
        }

        &.correct {
          border-color: rgba($correctColor, 0.5);
          background: rgba($correctColor, 0.2);
        }
        &.wrong {
          border-color: rgba($wrongColor, 0.5);
          background: rgba($wrongColor, 0.2);
        }

        & > span {
          border: solid 2px $secondaryTextColor;
          padding: 10px;
          margin: 4px;
          margin-right: 10px;
          border-radius: 5px;
          transition: background 0.1s linear;
          font-weight: bolder;
        }
      }
    }
  }

  .basketScopes {
    border-radius: 10px;
    padding: 5px;
    margin-top: 10px;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 100vw;

    .basket {
      cursor: pointer;
      max-width: 100vw;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      padding: 3px;
      box-sizing: border-box;

      transition: all 0.1s linear;

      border: solid 3px transparent;

      &:hover {
        background: $hoverColor;
      }

      &:not(:last-child) {
        border-bottom-color: rgba(192, 192, 192, 0.2);
        margin-bottom: 2px;
      }

      &.selected {
        background: #525355;
      }

      text-align: start;

      .count {
        align-self: flex-end;
        color: $secondaryTextColor;
      }
    }
  }
}
</style>
