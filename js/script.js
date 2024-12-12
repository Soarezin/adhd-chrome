
document.addEventListener('DOMContentLoaded', () => {
  const focusTimeSelect = document.getElementById('focus-time');
  const soundIntervalSelect = document.getElementById('sound-interval');
  const soundTypeSelect = document.getElementById('sound-type');
  const startButton = document.getElementById('start-timer');
  const stopButton = document.getElementById('stop-timer');
  const timerDisplay = document.getElementById('timer-display');

  startButton.addEventListener('click', () => {
    const focusTime = parseInt(focusTimeSelect.value);
    const soundInterval = parseInt(soundIntervalSelect.value);
    const soundType = soundTypeSelect.value;

    chrome.runtime.sendMessage({
      type: 'start-timer',
      minutes: focusTime,
      soundInterval: soundInterval,
      soundType: soundType
    }, (response) => {
      if (response.status === 'started') {
        startButton.disabled = true;
        stopButton.disabled = false;
      }
    });
  });

  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'stop-timer'
    }, (response) => {
      if (response.status === 'stopped') {
        startButton.disabled = false;
        stopButton.disabled = true;
        timerDisplay.textContent = '00:00';
      }
    });
  });

  // Receber atualizações de tempo do background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'timer-update') {
      const minutes = Math.floor(request.time / 60);
      const seconds = request.time % 60;
      timerDisplay.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  });

  // Carregar histórico (similar ao código anterior)
  function loadHistory() {
    chrome.storage.local.get(['focusHistory'], (result) => {
      const history = result.focusHistory || [];
      const historyList = document.getElementById('history-list');
      
      historyList.innerHTML = history.length > 0 
        ? history.reverse().map(session => `
            <div class="history-item">
              <span>${session.date}</span>
              <span>${session.duration} min</span>
            </div>
          `).join('')
        : '<p>Nenhuma sessão de foco registrada</p>';
    });
  }

  // Limpar histórico
  document.getElementById('clear-history').addEventListener('click', () => {
    chrome.storage.local.remove('focusHistory', () => {
      loadHistory();
    });
  });

  // Carregar histórico ao abrir popup
  loadHistory();
});