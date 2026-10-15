/**
 * accessibility.js - Gerenciamento de Acessibilidade, Alto Contraste e Atalhos
 */

document.addEventListener('DOMContentLoaded', () => {
    const btnStatusSummary = document.getElementById('btn-status-summary');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const btnVoiceToggle = document.getElementById('btn-voice-toggle');
    const btnContrastToggle = document.getElementById('btn-contrast-toggle');
    const btnOpenHelp = document.getElementById('btn-open-help');
    const btnCloseHelp = document.getElementById('btn-close-help');
    const helpDialog = document.getElementById('help-dialog');

    let soundOn = true;
    let voiceOn = true;
    let highContrastOn = false;

    // Resumo da partida
    btnStatusSummary.addEventListener('click', () => {
        if (window.trucoGame) {
            window.trucoAudio.playClick();
            window.trucoGame.readFullGameStatus();
        }
    });

    // Alternar Som (Efeitos sonoros sintetizados)
    function toggleSound() {
        soundOn = !soundOn;
        window.trucoAudio.setSoundEnabled(soundOn);
        btnSoundToggle.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
        btnSoundToggle.setAttribute('aria-label', `Efeitos Sonoros: ${soundOn ? 'Ativados' : 'Desativados'} (Atalho tecla M)`);
        btnSoundToggle.innerHTML = `${soundOn ? '🔊' : '🔇'} <span class="btn-text">Som (M)</span>`;

        if (window.trucoGame) {
            window.trucoGame.announce(`Efeitos sonoros ${soundOn ? 'ativados' : 'desativados'}.`, true);
        }
        if (soundOn) {
            window.trucoAudio.playClick();
        }
    }

    btnSoundToggle.addEventListener('click', toggleSound);

    // Alternar Narração por Voz
    function toggleVoice() {
        voiceOn = !voiceOn;
        window.trucoAudio.setVoiceEnabled(voiceOn);
        btnVoiceToggle.setAttribute('aria-pressed', voiceOn ? 'true' : 'false');
        btnVoiceToggle.setAttribute('aria-label', `Narração de Voz: ${voiceOn ? 'Ativada' : 'Desativada'} (Atalho tecla V)`);
        btnVoiceToggle.innerHTML = `${voiceOn ? '🗣️' : '🤐'} <span class="btn-text">Voz (V)</span>`;

        if (window.trucoGame) {
            window.trucoGame.announce(`Narração de voz ${voiceOn ? 'ativada' : 'desativada'}.`, true);
        }
        if (voiceOn) {
            window.trucoAudio.speak('Narração de voz ativada!');
        }
    }

    btnVoiceToggle.addEventListener('click', toggleVoice);

    // Alternar Alto Contraste
    function toggleContrast() {
        highContrastOn = !highContrastOn;
        document.body.classList.toggle('high-contrast', highContrastOn);
        btnContrastToggle.setAttribute('aria-pressed', highContrastOn ? 'true' : 'false');
        btnContrastToggle.setAttribute('aria-label', `Alto Contraste: ${highContrastOn ? 'Ativado' : 'Desativado'}`);

        if (window.trucoGame) {
            window.trucoGame.announce(`Modo Alto Contraste ${highContrastOn ? 'ativado' : 'desativado'}.`, true);
        }
        window.trucoAudio.playClick();
    }

    btnContrastToggle.addEventListener('click', toggleContrast);

    // Modal de Ajuda
    let lastActiveElementBeforeModal = null;

    function openHelp() {
        lastActiveElementBeforeModal = document.activeElement;
        helpDialog.showModal();
        btnCloseHelp.focus();
        if (window.trucoGame) {
            window.trucoGame.announce('Janela de ajuda e regras aberta. Use Tab para navegar ou Esc para fechar.', true);
        }
        window.trucoAudio.playClick();
    }

    function closeHelp() {
        helpDialog.close();
        if (lastActiveElementBeforeModal) {
            lastActiveElementBeforeModal.focus();
        }
        if (window.trucoGame) {
            window.trucoGame.announce('Janela de ajuda fechada.', true);
        }
        window.trucoAudio.playClick();
    }

    btnOpenHelp.addEventListener('click', openHelp);
    btnCloseHelp.addEventListener('click', closeHelp);

    // Tecla M e V globais
    window.addEventListener('keydown', (e) => {
        const targetTag = e.target.tagName.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea') return;

        const key = e.key.toUpperCase();
        if (key === 'M') {
            e.preventDefault();
            toggleSound();
        } else if (key === 'V') {
            e.preventDefault();
            toggleVoice();
        }
    });
});
