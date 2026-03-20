import { settings } from '../../services/settings.js';
import { getTuning } from '../../theory/tunings.js';

function stringDisplay(challenge) {
    const glob = settings.global;
    if (glob.stringLabels === 'numbers') {
        const tuning = getTuning(glob.tuning);
        return 'string ' + (tuning.strings.length - challenge.string_index);
    }
    return 'the <strong>' + challenge.string_name + '</strong> string';
}

export function renderChallengeUI(container, challenge, game) {
    let ui = container.querySelector('.find-note-ui');
    if (!ui) {
        ui = document.createElement('div');
        ui.className = 'find-note-ui';
        container.prepend(ui);
    }

    const progress = `${game.total}/${game.notesPerGame}`;

    if (!challenge) {
        ui.innerHTML = `
            <div class="challenge-prompt"><span class="challenge-text">Loading...</span></div>
            <div class="game-info">
                <div class="score-display">
                    <span class="score">${game.score}/${game.total}</span>
                    <span class="progress">${progress}</span>
                    <span class="streak">${game.streak > 1 ? game.streak + ' streak' : ''}</span>
                </div>
            </div>`;
        return;
    }

    ui.innerHTML = `
        <div class="challenge-prompt">
            <span class="challenge-text">Find <strong>${challenge.note_name}</strong> on ${stringDisplay(challenge)}</span>
        </div>
        <div class="game-info">
            <div class="score-display">
                <span class="score">${game.score}/${game.total}</span>
                <span class="progress">${progress}</span>
                <span class="streak">${game.streak > 1 ? game.streak + ' streak' : ''}</span>
            </div>
            <div id="timer-display"></div>
        </div>`;
}

export function renderTimer(container, remaining, total) {
    const el = container.querySelector('#timer-display');
    if (!el) return;
    const pct = Math.max(0, (remaining / total) * 100);
    el.innerHTML = `
        <div class="timer-bar"><div class="timer-fill" style="width:${pct}%"></div></div>
        <span class="timer-text">${remaining}s</span>`;
}

export function renderTimedOut(container) {
    const prompt = container.querySelector('.challenge-prompt');
    if (!prompt) return;
    prompt.classList.add('result-timeout');
    if (!prompt.querySelector('.timeout-msg')) {
        const msg = document.createElement('div');
        msg.className = 'timeout-msg';
        msg.textContent = "Time's up! Keep trying.";
        prompt.appendChild(msg);
    }
}

export function renderResult(container, correct) {
    const prompt = container.querySelector('.challenge-prompt');
    if (!prompt) return;
    prompt.classList.remove('result-correct', 'result-wrong');
    prompt.classList.add(correct ? 'result-correct' : 'result-wrong');
}

export function renderGameOver(container, score, total, onRestart) {
    let ui = container.querySelector('.find-note-ui');
    if (!ui) {
        ui = document.createElement('div');
        ui.className = 'find-note-ui';
        container.prepend(ui);
    }
    const pct = total > 0 ? Math.round(score / total * 100) : 0;
    ui.innerHTML = `
        <div class="game-over">
            <h2>Game Over</h2>
            <div class="game-over-score">${score} / ${total} correct (${pct}%)</div>
            <button class="restart-btn">New Game</button>
        </div>`;
    ui.querySelector('.restart-btn').addEventListener('click', onRestart);
}
