let focusTimer = null;
let remainingTime = 0;
let soundInterval = 0;
let soundType = 'soft';

// Função para iniciar o timer em segundo plano
function startBackgroundTimer(minutes, interval, sound) {
  // Limpar qualquer timer existente
  if (focusTimer) {
    clearInterval(focusTimer);
  }

  remainingTime = minutes * 60;
  soundInterval = interval;
  soundType = sound;

  // Criar um alarme para terminar o timer
  chrome.alarms.create('focusTimerEnd', { 
    delayInMinutes: minutes 
  });

  // Iniciar o intervalo de contagem
  focusTimer = setInterval(() => {
    remainingTime--;

    // Enviar mensagem para popup com tempo restante
    chrome.runtime.sendMessage({
      type: 'timer-update',
      time: remainingTime
    });

    // Tocar som em intervalos definidos
    if (remainingTime % soundInterval === 0 && remainingTime > 0) {
      playSound(soundType);
    }

    // Salvar estado atual no storage
    chrome.storage.local.set({
      timerActive: true,
      remainingTime: remainingTime,
      startTime: Date.now()
    });

    if (remainingTime <= 0) {
      stopBackgroundTimer();
    }
  }, 1000);
}

// Função para parar o timer
function stopBackgroundTimer() {
  if (focusTimer) {
    clearInterval(focusTimer);
    focusTimer = null;
  }

  // Limpar alarme
  chrome.alarms.clear('focusTimerEnd');

  // Calcular duração da sessão
  chrome.storage.local.get(['startTime'], (result) => {
    if (result.startTime) {
      const duration = Math.round((Date.now() - result.startTime) / 1000 / 60);
      saveFocusSession(duration);
    }
  });

  // Limpar estado do storage
  chrome.storage.local.set({
    timerActive: false,
    remainingTime: 0,
    startTime: null
  });

  // Enviar notificação de fim de sessão
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: 'Sessão de Foco Concluída',
    message: 'Parabéns! Você completou sua sessão de foco.'
  });
}

// Função para tocar som
function playSound(soundType) {
  const sounds = {
    soft: 'sounds/soft.mp3',
    bell: 'sounds/bell.mp3',
    nature: 'sounds/nature.mp3',
    beep: 'sounds/beep.mp3'
  };

  // Criar e reproduzir áudio
  const audio = new Audio(sounds[soundType]);
  audio.play();
}

// Função para salvar histórico de sessões
function saveFocusSession(duration) {
  chrome.storage.local.get(['focusHistory'], (result) => {
    let history = result.focusHistory || [];
    
    history.push({
      date: new Date().toLocaleString(),
      duration: duration
    });

    // Limitar histórico às últimas 20 sessões
    if (history.length > 20) {
      history = history.slice(-20);
    }

    chrome.storage.local.set({ focusHistory: history });
  });
}

// Listener para mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'start-timer') {
    startBackgroundTimer(
      request.minutes, 
      request.soundInterval, 
      request.soundType
    );
    sendResponse({ status: 'started' });
  } else if (request.type === 'stop-timer') {
    stopBackgroundTimer();
    sendResponse({ status: 'stopped' });
  }
});

// Restaurar timer se estiver ativo após atualização/reinício
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['timerActive', 'remainingTime'], (result) => {
    if (result.timerActive && result.remainingTime > 0) {
      // Lógica para restaurar timer
    }
  });
});
