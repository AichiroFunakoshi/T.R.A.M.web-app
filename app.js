document.addEventListener('DOMContentLoaded', () => {
    // 各セクション要素の取得
    const apiKeySection = document.getElementById('api-key-section');
    const audioUploadSection = document.getElementById('audio-upload-section');
    const processingSection = document.getElementById('processing-section');
    const resultSection = document.getElementById('result-section');
    
    // ボタン要素の取得
    const prevStepBtn = document.getElementById('prev-step');
    const nextStepBtn = document.getElementById('next-step');
    const startProcessBtn = document.getElementById('start-process');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const downloadResultBtn = document.getElementById('download-result');
    const copyResultBtn = document.getElementById('copy-result');
    const restartBtn = document.getElementById('restart');
    
    // 入力・表示要素の取得
    const apiKeyInput = document.getElementById('openai-api-key');
    const keyStatus = document.getElementById('key-status');
    const audioFileInput = document.getElementById('audio-file');
    const uploadArea = document.getElementById('upload-area');
    const fileInfo = document.getElementById('file-info');
    const progressBar = document.getElementById('progress');
    const progressStatus = document.getElementById('progress-status');
    const resultContent = document.getElementById('result-content');
    
    // 現在のステップとアップロードされたファイルの保存用
    let currentStep = 0;
    let audioFile = null;
    let transcription = '';
    
    // APIキーのローカルストレージキー
    const API_KEY_STORAGE_KEY = 'tram_openai_api_key';
    
    // ステップの表示/非表示を切り替える関数
    function showStep(stepIndex) {
        const sections = [apiKeySection, audioUploadSection, processingSection, resultSection];
        sections.forEach((section, index) => {
            if (index === stepIndex) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        
        // ボタンの状態を更新
        prevStepBtn.disabled = stepIndex === 0;
        
        // ナビゲーションボタンの表示/非表示
        if (stepIndex === 1) {
            nextStepBtn.style.display = 'none';
            startProcessBtn.style.display = 'inline-flex';
        } else {
            nextStepBtn.style.display = 'inline-flex';
            startProcessBtn.style.display = 'none';
        }
        
        // 結果画面では前へ/次へボタンを非表示
        if (stepIndex === 3) {
            prevStepBtn.style.display = 'none';
            nextStepBtn.style.display = 'none';
        } else {
            prevStepBtn.style.display = 'inline-flex';
        }
        
        currentStep = stepIndex;
    }
    
    // 前のステップに戻るボタンのイベントリスナー
    prevStepBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            showStep(currentStep - 1);
        }
    });
    
    // 次のステップに進むボタンのイベントリスナー
    nextStepBtn.addEventListener('click', () => {
        if (currentStep === 0 && !isApiKeyValid()) {
            keyStatus.innerHTML = '<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> APIキーを入力して保存してください</div>';
            return;
        }
        
        if (currentStep < 3) {
            showStep(currentStep + 1);
        }
    });
    
    // APIキーの保存ボタンのイベントリスナー
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            keyStatus.innerHTML = '<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> APIキーを入力してください</div>';
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            keyStatus.innerHTML = '<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> 無効なAPIキー形式です</div>';
            return;
        }
        
        // APIキーをローカルストレージに保存
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        
        keyStatus.innerHTML = '<div style="color: var(--success-color);"><i class="fas fa-check-circle"></i> APIキーが保存されました</div>';
        
        // 次へボタンを有効化
        nextStepBtn.disabled = false;
    });
    
    // 保存されたAPIキーの読み込み
    function loadSavedApiKey() {
        const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (savedKey) {
            apiKeyInput.value = savedKey;
            keyStatus.innerHTML = '<div style="color: var(--success-color);"><i class="fas fa-check-circle"></i> 保存されたAPIキーが読み込まれました</div>';
        }
    }
    
    // APIキーが有効かチェック
    function isApiKeyValid() {
        return apiKeyInput.value.trim() && apiKeyInput.value.trim().startsWith('sk-');
    }
    
    // ドラッグ&ドロップのイベントリスナー
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('active');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('active');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
    
    // アップロードエリアのクリックでファイル選択
    uploadArea.addEventListener('click', () => {
        audioFileInput.click();
    });
    
    // ファイル入力の変更イベント
    audioFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // ファイル選択の処理
    function handleFileSelection(file) {
        const validTypes = ['audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/mpeg'];
        const maxSize = 25 * 1024 * 1024; // 25MB
        
        if (!validTypes.includes(file.type)) {
            fileInfo.innerHTML = '<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> サポートされていないファイル形式です。MP3, WAV, M4Aのみを使用してください。</div>';
            return;
        }
        
        if (file.size > maxSize) {
            fileInfo.innerHTML = '<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> ファイルサイズが大きすぎます。25MB以下のファイルを使用してください。</div>';
            return;
        }
        
        audioFile = file;
        fileInfo.innerHTML = `
            <div style="color: var(--success-color);">
                <i class="fas fa-check-circle"></i> 選択されたファイル: ${file.name}
            </div>
            <div>サイズ: ${formatFileSize(file.size)}</div>
        `;
        
        // 開始ボタンを有効化
        startProcessBtn.disabled = false;
    }
    
    // ファイルサイズのフォーマット
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " bytes";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    }
    
    // 処理開始ボタンのイベントリスナー
    startProcessBtn.addEventListener('click', async () => {
        if (!audioFile) {
            fileInfo.innerHTML = '<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> 音声ファイルをアップロードしてください</div>';
            return;
        }
        
        if (!isApiKeyValid()) {
            showStep(0);
            keyStatus.innerHTML = '<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> APIキーを入力して保存してください</div>';
            return;
        }
        
        // 処理画面に移動
        showStep(2);
        
        try {
            // 文字起こし処理を開始
            await processAudio();
        } catch (error) {
            progressStatus.textContent = `エラーが発生しました: ${error.message}`;
            progressStatus.style.color = 'var(--danger-color)';
        }
    });
    
    // 音声処理とOpenAI APIの呼び出し
    async function processAudio() {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        
        // ステップ1: 文字起こし準備
        updateProgress(10, "音声ファイルを処理しています...");
        
        try {
            // ステップ2: OpenAI Whisper APIで文字起こし
            updateProgress(30, "文字起こしを実行中...");
            const transcriptionResult = await transcribeAudio(audioFile, apiKey);
            transcription = transcriptionResult;
            
            // ステップ3: 文字起こし結果から議事録生成
            updateProgress(60, "議事録を生成中...");
            const minutes = await generateMinutes(transcription, apiKey);
            
            // 処理完了
            updateProgress(100, "完了しました！");
            
            // 結果を表示
            resultContent.textContent = minutes;
            setTimeout(() => {
                showStep(3);
            }, 1000);
            
        } catch (error) {
            console.error("処理エラー:", error);
            progressStatus.innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> エラー: ${error.message}</div>`;
            throw error;
        }
    }
    
    // OpenAI APIによる音声文字起こし
    async function transcribeAudio(audioFile, apiKey) {
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-1');
        formData.append('language', 'ja');
        
        try {
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || '文字起こし中にエラーが発生しました');
            }
            
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error('文字起こしエラー:', error);
            throw error;
        }
    }
    
    // OpenAI APIによる議事録生成
    async function generateMinutes(transcriptionText, apiKey) {
        const systemPrompt = 
            `あなたは議事録作成の専門家です。音声から文字起こしされたテキストを元に、明確で構造化された議事録を作成してください。
            以下の形式を守ってください:
            
            1. 会議の概要を要約する
            2. 主要な議題をリストアップする
            3. 各議題について詳細と決定事項を記載する
            4. アクションアイテムと担当者を特定する
            5. 次回の会議予定があれば記載する
            
            専門用語や固有名詞は正確に保持してください。内容は簡潔かつ明確に記載し、議事録として必要な情報を漏れなく含めてください。`;
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: `以下の文字起こしテキストから議事録を作成してください:\n\n${transcriptionText}`
                        }
                    ],
                    temperature: 0.3
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || '議事録生成中にエラーが発生しました');
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('議事録生成エラー:', error);
            throw error;
        }
    }
    
    // プログレスバーの更新
    function updateProgress(percent, statusText) {
        progressBar.style.width = `${percent}%`;
        progressStatus.textContent = statusText;
    }
    
    // ダウンロードボタンのイベントリスナー
    downloadResultBtn.addEventListener('click', () => {
        const minutes = resultContent.textContent;
        if (!minutes) return;
        
        const blob = new Blob([minutes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `議事録_${formatDate(new Date())}.txt`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });
    
    // 日付のフォーマット
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}${month}${day}_${hours}${minutes}`;
    }
    
    // コピーボタンのイベントリスナー
    copyResultBtn.addEventListener('click', () => {
        const minutes = resultContent.textContent;
        if (!minutes) return;
        
        navigator.clipboard.writeText(minutes)
            .then(() => {
                const originalText = copyResultBtn.innerHTML;
                copyResultBtn.innerHTML = '<i class="fas fa-check"></i> コピーしました';
                
                setTimeout(() => {
                    copyResultBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('テキストのコピーに失敗しました:', err);
            });
    });
    
    // 再開始ボタンのイベントリスナー
    restartBtn.addEventListener('click', () => {
        audioFile = null;
        transcription = '';
        resultContent.textContent = '';
        progressBar.style.width = '0%';
        fileInfo.innerHTML = '';
        
        showStep(0);
    });
    
    // 初期化処理
    function init() {
        loadSavedApiKey();
        showStep(0);
    }
    
    // アプリケーションの初期化
    init();
}); 