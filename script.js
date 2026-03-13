// ==========================================
// 1. ПОДКЛЮЧЕНИЕ ОБЛАЧНОЙ БАЗЫ FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyChsg1t0QKS_sSThC0KHZbluyNxMDkRlJo",
    authDomain: "kod-pobedy.firebaseapp.com",
    databaseURL: "https://kod-pobedy-default-rtdb.firebaseio.com",
    projectId: "kod-pobedy",
    storageBucket: "kod-pobedy.firebasestorage.app",
    messagingSenderId: "372401802248",
    appId: "1:372401802248:web:e2080dfbd9e335e30b55bd"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const PASS = "script2000";

// База данных по умолчанию (если облако пустое)
const defaultGames = [
    {
        id: 1, title: "Оружие Победы", questions: [
            { type: "photo", q: "Какой легендарный танк представлен на этой фотографии?", img: "https://upload.wikimedia.org/wikipedia/commons/1/1a/T-34_in_the_museum.jpg", options: ["Т-34", "КВ-1", "ИС-2", "Тигр"], correct: 0 },
            { type: "photo", q: "Как в народе называли эту знаменитую реактивную систему залпового огня?", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Katyusha_BM-13.jpg/800px-Katyusha_BM-13.jpg", options: ["Катюша", "Андрюша", "Зверобой", "Илья Муромец"], correct: 0 },
            { type: "photo", q: "Самый массовый самолет-штурмовик в истории авиации, прозванный немцами «Черная смерть».", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Il-2_m3.jpg/800px-Il-2_m3.jpg", options: ["Ил-2", "Пе-2", "Як-9", "Ла-5"], correct: 0 },
            { type: "photo", q: "Какой пистолет-пулемет с дисковым магазином стал символом советского солдата?", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/PPSh-41_2.jpg/800px-PPSh-41_2.jpg", options: ["ППШ-41", "ППС-43", "ППД-40", "MP-40"], correct: 0 }
        ]
    },
    {
        id: 2, title: "Оборона Тулы", questions: [
            { type: "photo", q: "Командующий 50-й армией, сыгравшей ключевую роль в обороне Тулы. Кто на фото?", img: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Boldin_IV.jpg", options: ["Иван Болдин", "Георгий Жуков", "Константин Рокоссовский", "Александр Василевский"], correct: 0 },
            { type: "date", q: "Окончание героической обороны Тулы и снятие осады города", img: "", options: ["5 декабря 1941", "22 июня 1941", "9 мая 1945", "15 января 1942"], correct: 0 },
            { type: "error", q: "В обороне города активно участвовал Тульский морский полк, сформированный из матросов.", img: "", options: ["Тульский рабочий полк", "Тульский гвардейский полк", "Тульский бронетанковый полк"], correct: 0 }
        ]
    },
    {
        id: 3, title: "Битва за Москву", questions: [
            { type: "date", q: "Начало контрнаступления советских войск под Москвой", img: "", options: ["5 декабря 1941", "7 ноября 1941", "1 января 1942", "23 февраля 1942"], correct: 0 },
            { type: "error", q: "Знаменитый парад на Красной площади, с которого солдаты уходили прямо на фронт, прошел 1 мая 1941 года.", img: "", options: ["7 ноября 1941 года", "9 мая 1945 года", "22 июня 1941 года"], correct: 0 }
        ]
    }
];

let myGames = [];
let leaders = [];

// Игровые переменные
let activeGame = null;
let currentQuestionIndex = 0;
let score = 0;
let currentEditingGameId = null;
let currentEditingQuestionIndex = null;

// ==========================================
// 2. СИНХРОНИЗАЦИЯ С ОБЛАКОМ (В РЕАЛЬНОМ ВРЕМЕНИ)
// ==========================================
onValue(ref(db, 'games'), (snapshot) => {
    if (snapshot.exists()) {
        myGames = snapshot.val();
    } else {
        myGames = defaultGames;
        set(ref(db, 'games'), myGames);
    }
    renderGameList();
    renderAdminGames();
    if(currentEditingGameId) renderQuestionsList();
});

onValue(ref(db, 'leaders'), (snapshot) => {
    if (snapshot.exists()) {
        leaders = snapshot.val();
    } else {
        leaders = [];
    }
    updateLeaderboardUI();
});

// ==========================================
// 3. НАВИГАЦИЯ ПО ЭКРАНАМ
// ==========================================
function switchScreen(screenId) {
    let screens = document.querySelectorAll('.screen');
    for (let i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
    }
    document.getElementById(screenId).classList.add('active');
}

function showMenu() { switchScreen('menu'); }
function showLogin() { switchScreen('login'); }
function showLeaderboard() { switchScreen('lider'); updateLeaderboardUI(); }

// ==========================================
// 4. МОДЕРИРОВАНИЕ (АДМИНКА)
// ==========================================
function checkLogin() {
    let input = document.getElementById('admin-pass');
    if (input.value === PASS) {
        input.value = ""; 
        renderAdminGames();
        switchScreen('admin');
    } else { 
        alert("Неверный пароль!"); 
    }
}

function renderAdminGames() {
    let container = document.getElementById('admin-games-list');
    let html = "";
    if (!myGames) return;
    for (let i = 0; i < myGames.length; i++) {
        let game = myGames[i];
        let qCount = game.questions ? game.questions.length : 0;
        html += `
            <div class="admin-item">
                <span><b>${game.title}</b> <br><small class="text-muted">${qCount} вопросов</small></span>
                <div class="admin-item-controls">
                    <button onclick="window.manageQuestions(${game.id})" class="btn-primary">✏️</button>
                    <button onclick="window.deleteGame(${game.id})" class="btn-dark">❌</button>
                </div>
            </div>`;
    }
    container.innerHTML = html || "<p class='text-center text-muted'>Кампаний пока нет</p>";
}

function createNewGame() {
    let title = prompt("Введите название новой кампании:");
    if (title && title.trim() !== "") {
        myGames.push({ id: Date.now(), title: title, questions: [] });
        set(ref(db, 'games'), myGames);
    }
}

function deleteGame(id) {
    if (confirm("Вы уверены, что хотите удалить эту кампанию?")) { 
        myGames = myGames.filter(game => game.id !== id); 
        set(ref(db, 'games'), myGames);
    }
}

function manageQuestions(id) {
    currentEditingGameId = id;
    let game = myGames.find(g => g.id === id);
    document.getElementById('manager-title').innerText = game.title;
    renderQuestionsList();
    switchScreen('manager');
}

function renderQuestionsList() {
    let game = myGames.find(g => g.id === currentEditingGameId);
    let container = document.getElementById('admin-questions-list');
    let html = "";
    if (game.questions) {
        for (let i = 0; i < game.questions.length; i++) {
            let q = game.questions[i];
            let icon = q.type === 'photo' ? '🖼️' : '📝';
            html += `
                <div class="admin-item">
                    <span>${icon} ${q.q.substring(0, 20)}...</span>
                    <div class="admin-item-controls">
                        <button onclick="window.openEditor(${i})" class="btn-primary">⚙️</button>
                        <button onclick="window.deleteQuestion(${i})" class="btn-dark">❌</button>
                    </div>
                </div>`;
        }
    }
    container.innerHTML = html || "<p class='text-center text-muted'>Вопросов пока нет</p>";
}

function toggleEditorFields() {
    let type = document.getElementById('edit-type').value;
    document.getElementById('div-edit-img').style.display = (type === 'photo') ? 'block' : 'none';
}

function openEditor(index = null) {
    currentEditingQuestionIndex = index;
    if (index !== null) {
        let q = myGames.find(g => g.id === currentEditingGameId).questions[index];
        document.getElementById('edit-type').value = q.type;
        document.getElementById('edit-q').value = q.q;
        document.getElementById('edit-img').value = q.img || '';
        document.getElementById('edit-opt0').value = q.options[0] || '';
        document.getElementById('edit-opt1').value = q.options[1] || '';
        document.getElementById('edit-opt2').value = q.options[2] || '';
        document.getElementById('edit-opt3').value = q.options[3] || '';
    } else {
        document.getElementById('edit-q').value = '';
        document.getElementById('edit-img').value = '';
        document.getElementById('edit-opt0').value = '';
        document.getElementById('edit-opt1').value = '';
        document.getElementById('edit-opt2').value = '';
        document.getElementById('edit-opt3').value = '';
    }
    toggleEditorFields();
    switchScreen('editor');
}

function saveQuestion() {
    let game = myGames.find(g => g.id === currentEditingGameId);
    if (!game.questions) game.questions = [];
    
    let optionsArray = [];
    for (let i = 0; i <= 3; i++) {
        let optValue = document.getElementById('edit-opt' + i).value.trim();
        if (optValue !== "") optionsArray.push(optValue);
    }

    let newQuestion = {
        type: document.getElementById('edit-type').value,
        q: document.getElementById('edit-q').value,
        img: document.getElementById('edit-img').value.trim(),
        options: optionsArray,
        correct: 0 
    };
    
    if (currentEditingQuestionIndex !== null) {
        game.questions[currentEditingQuestionIndex] = newQuestion;
    } else {
        game.questions.push(newQuestion);
    }
    
    set(ref(db, 'games'), myGames);
    switchScreen('manager');
}

function deleteQuestion(index) {
    if (confirm("Удалить этот вопрос?")) {
        myGames.find(g => g.id === currentEditingGameId).questions.splice(index, 1);
        set(ref(db, 'games'), myGames);
    }
}

// ==========================================
// 5. ИГРОВОЙ ДВИЖОК
// ==========================================
function renderGameList() {
    let container = document.getElementById('game-list-container');
    let html = "";
    if (!myGames) return;
    for (let i = 0; i < myGames.length; i++) {
        let game = myGames[i];
        html += `<button onclick="window.playGame(${game.id})">${game.title}</button>`;
    }
    container.innerHTML = html;
}

function playGame(id) {
    activeGame = myGames.find(g => g.id === id);
    if (!activeGame.questions || activeGame.questions.length === 0) {
        return alert("В этой кампании пока нет заданий.");
    }
    currentQuestionIndex = 0; 
    score = 0;
    switchScreen('game');
    showQuestion();
}

function showQuestion() {
    let q = activeGame.questions[currentQuestionIndex];
    
    document.getElementById('game-title-display').innerText = activeGame.title;
    document.getElementById('game-step').innerText = (currentQuestionIndex + 1) + " / " + activeGame.questions.length;
    document.getElementById('game-question').innerText = q.q;
    
    let badge = document.getElementById('game-format-label');
    if (q.type === 'photo') { 
        badge.innerText = "Угадай по фото"; 
        badge.style.backgroundColor = "var(--secondary)"; 
    } else if (q.type === 'date') { 
        badge.innerText = "Вспомни дату"; 
        badge.style.backgroundColor = "#B71C1C"; 
    } else { 
        badge.innerText = "Найди ошибку"; 
        badge.style.backgroundColor = "#E65100"; 
    }

    let pCont = document.getElementById('photo-container');
    let photoEl = document.getElementById('game-photo');
    photoEl.setAttribute("referrerpolicy", "no-referrer"); // Защита для работы фото из Википедии

    if (q.type === 'photo') { 
        pCont.style.display = 'block'; 
        photoEl.src = q.img ? q.img : 'https://via.placeholder.com/400x200?text=Нет+фото';
        photoEl.onerror = function() { this.src = 'https://via.placeholder.com/400x200?text=Ошибка+загрузки'; };
    } else { 
        pCont.style.display = 'none'; 
    }

    let optCont = document.getElementById('game-options');
    optCont.innerHTML = '';
    
    let answers = [];
    for (let i = 0; i < q.options.length; i++) answers.push({ text: q.options[i], isCorrect: (i === 0) });
    answers.sort(() => Math.random() - 0.5);

    for (let i = 0; i < answers.length; i++) {
        let answer = answers[i];
        let btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = answer.text;
        
        // ЖЕЛЕЗОБЕТОННЫЙ ТРЮК: Вшиваем скрытую метку правильного ответа прямо в кнопку
        btn.dataset.correct = answer.isCorrect; 
        
        btn.onclick = function() { window.checkAnswer(btn, answer.isCorrect); };
        optCont.appendChild(btn);
    }
}

function checkAnswer(clickedBtn, isCorrect) {
    let allBtns = document.getElementById('game-options').children;
    
    // Перебираем все кнопки на экране
    for (let i = 0; i < allBtns.length; i++) {
        allBtns[i].disabled = true; // Сразу блокируем все кнопки от повторных кликов
        
        // Если у кнопки есть скрытая метка правильного ответа - всегда красим её в ЗЕЛЕНЫЙ
        if (allBtns[i].dataset.correct === "true") {
            allBtns[i].classList.add('correct');
        }
    }
    
    // Если игрок ответил верно, добавляем очко
    if (isCorrect) { 
        score++; 
    } else { 
        // Если игрок ошибся - красим ЕГО нажатую кнопку в КРАСНЫЙ
        clickedBtn.classList.add('wrong'); 
    }
    
    // Ждем полторы секунды и показываем следующий вопрос
    setTimeout(function() {
        currentQuestionIndex++;
        if (currentQuestionIndex < activeGame.questions.length) showQuestion();
        else finishGame();
    }, 1500);
}

function finishGame() {
    switchScreen('result');
    document.getElementById('final-score').innerText = score + " из " + activeGame.questions.length;
}

// ==========================================
// 6. ТАБЛИЦА ЛИДЕРОВ (СОХРАНЕНИЕ В ОБЛАКО)
// ==========================================
function submitScore() {
    let name = document.getElementById('player-name').value.trim() || "Гость";
    
    leaders.push({ name: name, score: score, game: activeGame.title });
    leaders.sort((a, b) => b.score - a.score);
    leaders = leaders.slice(0, 20); // Оставляем топ-20
    
    set(ref(db, 'leaders'), leaders);
    
    document.getElementById('player-name').value = '';
    showLeaderboard();
}

function updateLeaderboardUI() {
    let cont = document.getElementById('leader-data');
    let html = "";
    
    for (let i = 0; i < leaders.length; i++) {
        let l = leaders[i];
        let medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `<span class="text-muted">#${i+1}</span>`;
        
        html += `
            <div class="leader-card">
                <div class="medal-slot">${medal}</div>
                <div class="leader-info">
                    <span class="leader-name">${l.name}</span>
                    <span class="leader-campaign">${l.game}</span>
                </div>
                <div class="leader-score">${l.score}</div>
            </div>`;
    }
    
    cont.innerHTML = html || "<p class='text-center text-muted'>Список пуст. Станьте первым!</p>";
}

// Делаем функции доступными для HTML-кнопок
window.showMenu = showMenu;
window.showLogin = showLogin;
window.showLeaderboard = showLeaderboard;
window.checkLogin = checkLogin;
window.createNewGame = createNewGame;
window.deleteGame = deleteGame;
window.manageQuestions = manageQuestions;
window.openEditor = openEditor;
window.deleteQuestion = deleteQuestion;
window.toggleEditorFields = toggleEditorFields;
window.saveQuestion = saveQuestion;
window.switchScreen = switchScreen;
window.playGame = playGame;
window.checkAnswer = checkAnswer;
window.submitScore = submitScore;