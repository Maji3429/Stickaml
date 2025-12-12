'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import StickyNote from "./components/StickyNote";
import { Note, CanvasDimensions, CanvasSettings, CanvasPromptElement } from "./types";
import { generateYaml } from "./utils/yamlGenerator";
import { NoteFactory } from "./utils/noteFactory";

/**
 * YAMLビジュアルエディタのメインコンポーネント
 * ドラッグ＆ドロップ可能な付箋を配置し、YAMLとして出力する
 */
const VisualYamlEditor = () => {
    // 付箋ノートの状態管理
    const [notes, setNotes] = useState<Note[]>([
        // NoteFactoryを使用して初期付箋を作成
        NoteFactory.createNote("plain", 1, 50, 50, 250, 150, "例: 青い空と緑の草原")
    ]);

    // キャンバスのサイズ設定
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [customSize, setCustomSize] = useState({ width: 800, height: 450 });
    const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({ width: 800, height: 450 });
    const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
        aspectRatio: "16:9",
        width: 800,
        height: 450,
        promptElements: [] // キャンバス全体のプロンプト要素を初期化
    });
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    
    // Undo/Redo functionality
    const [history, setHistory] = useState<Note[][]>([[...notes]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    
    // Selected notes for multi-select
    const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
    
    // Toast notifications
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    // プロンプト要素カテゴリのオプション
    const promptElementCategories = [
        { value: "style", label: "画風/様式" },
        { value: "mood", label: "雰囲気" },
        { value: "lighting", label: "照明" },
        { value: "color", label: "色調" },
        { value: "camera", label: "カメラアングル" },
        { value: "time", label: "時間帯" },
        { value: "season", label: "季節" },
        { value: "weather", label: "天候" },
        { value: "theme", label: "テーマ" }
    ];

    // 新しいプロンプト要素の状態管理
    const [newPromptElement, setNewPromptElement] = useState({
        category: promptElementCategories[0].value,
        value: ""
    });

    /**
     * アスペクト比に基づいてキャンバスサイズを計算する
     */
    useEffect(() => {
        if (!canvasContainerRef.current) return;

        const containerWidth = canvasContainerRef.current.clientWidth;
        const containerHeight = canvasContainerRef.current.clientHeight;
        let canvasWidth, canvasHeight;

        if (aspectRatio === "custom") {
            canvasWidth = customSize.width;
            canvasHeight = customSize.height;
        } else {
            const [widthRatio, heightRatio] = aspectRatio.split(":").map(Number);

            // コンテナ内に収まる最大のサイズを計算（パディングの考慮）
            const maxWidth = containerWidth - 40; // パディング余裕
            const maxHeight = containerHeight - 100; // ツールバー+パディング

            // アスペクト比を維持しながら最大サイズに合わせる
            if (maxWidth / widthRatio < maxHeight / heightRatio) {
                canvasWidth = maxWidth;
                canvasHeight = (maxWidth / widthRatio) * heightRatio;
            } else {
                canvasHeight = maxHeight;
                canvasWidth = (maxHeight / heightRatio) * widthRatio;
            }
        }

        setCanvasDimensions({ width: canvasWidth, height: canvasHeight });

        // キャンバス設定情報を更新
        setCanvasSettings(prev => ({
            ...prev,
            aspectRatio,
            width: canvasWidth,
            height: canvasHeight,
            ...(aspectRatio === "custom" ? {
                customWidth: customSize.width,
                customHeight: customSize.height
            } : {})
        }));

        // 付箋がキャンバス外にある場合、キャンバス内に移動させる
        setNotes((prevNotes) =>
            prevNotes.map(note => {
                const updatedNote = { ...note };
                if (note.x + note.width > canvasWidth) {
                    updatedNote.x = canvasWidth - note.width;
                }
                if (note.y + note.height > canvasHeight) {
                    updatedNote.y = canvasHeight - note.height;
                }
                return updatedNote;
            })
        );
    }, [aspectRatio, customSize]);

    // ウィンドウリサイズ時にキャンバスサイズを再計算
    useEffect(() => {
        const handleResize = () => {
            // アスペクト比の変更をトリガーしてキャンバスリサイズを実行
            setAspectRatio(prev => prev);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /**
     * 付箋ノートを更新する関数
     * @param id 更新対象の付箋ID
     * @param updatedProperties 更新するプロパティ
     */
    const updateNote = (id: number, updatedProperties: Partial<Note>) => {
        setNotes((prevNotes) =>
            prevNotes.map((note) =>
                note.id === id ? { ...note, ...updatedProperties } : note
            )
        );
    };

    /**
     * 新しい付箋を追加する関数
     * @param type 付箋タイプ（デフォルトは"plain"）
     */
    const addNewNote = (type: string = "plain") => {
        const newId = Math.max(0, ...notes.map(note => note.id)) + 1;
        // NoteFactoryを使用して適切なタイプの付箋を生成
        const newNote = NoteFactory.createNote(type, newId);
        const newNotes = [...notes, newNote];
        setNotes(newNotes);
        addToHistory(newNotes);
        showToast('付箋を追加しました', 'success');
    };
    
    /**
     * 付箋を削除する関数
     * @param id 削除する付箋のID
     */
    const deleteNote = (id: number) => {
        const newNotes = notes.filter(note => note.id !== id);
        setNotes(newNotes);
        addToHistory(newNotes);
        showToast('付箋を削除しました', 'success');
    };
    
    /**
     * 付箋を複製する関数
     * @param id 複製する付箋のID
     */
    const duplicateNote = (id: number) => {
        const noteToDuplicate = notes.find(note => note.id === id);
        if (!noteToDuplicate) return;
        
        const newId = Math.max(0, ...notes.map(note => note.id)) + 1;
        const duplicatedNote = {
            ...noteToDuplicate,
            id: newId,
            x: noteToDuplicate.x + 20,
            y: noteToDuplicate.y + 20
        };
        const newNotes = [...notes, duplicatedNote];
        setNotes(newNotes);
        addToHistory(newNotes);
        showToast('付箋を複製しました', 'success');
    };
    
    /**
     * 履歴に追加する関数
     */
    const addToHistory = (newNotes: Note[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...newNotes]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };
    
    /**
     * Undo機能
     */
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setNotes([...history[historyIndex - 1]]);
            showToast('元に戻しました', 'info');
        }
    };
    
    /**
     * Redo機能
     */
    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setNotes([...history[historyIndex + 1]]);
            showToast('やり直しました', 'info');
        }
    };
    
    /**
     * Toast通知を表示する関数
     */
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);
    
    /**
     * キーボードショートカット
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z or Cmd+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (historyIndex > 0) {
                    setHistoryIndex(historyIndex - 1);
                    setNotes([...history[historyIndex - 1]]);
                    showToast('元に戻しました', 'info');
                }
            }
            // Ctrl+Y or Cmd+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                if (historyIndex < history.length - 1) {
                    setHistoryIndex(historyIndex + 1);
                    setNotes([...history[historyIndex + 1]]);
                    showToast('やり直しました', 'info');
                }
            }
            // Delete key to delete selected notes
            if (e.key === 'Delete' && selectedNotes.length > 0) {
                e.preventDefault();
                const newNotes = notes.filter(note => !selectedNotes.includes(note.id));
                setNotes(newNotes);
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push([...newNotes]);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
                setSelectedNotes([]);
                showToast(`${selectedNotes.length}個の付箋を削除しました`, 'success');
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [historyIndex, history, selectedNotes, notes, showToast]);
    
    /**
     * LocalStorageに自動保存
     */
    useEffect(() => {
        const saveData = {
            notes,
            canvasSettings,
            aspectRatio,
            customSize
        };
        localStorage.setItem('yamlVisualizer', JSON.stringify(saveData));
    }, [notes, canvasSettings, aspectRatio, customSize]);
    
    /**
     * LocalStorageから読み込み
     */
    useEffect(() => {
        const savedData = localStorage.getItem('yamlVisualizer');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.notes) setNotes(parsed.notes);
                if (parsed.canvasSettings) setCanvasSettings(parsed.canvasSettings);
                if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
                if (parsed.customSize) setCustomSize(parsed.customSize);
            } catch (e) {
                console.error('Failed to load saved data:', e);
            }
        }
    }, []);

    /**
     * 新しいプロンプト要素を追加する関数
     */
    const addPromptElement = () => {
        if (!newPromptElement.value.trim()) return; // 空の値は追加しない

        const newElement: CanvasPromptElement = {
            id: `prompt-${Date.now()}`, // ユニークIDを生成
            category: newPromptElement.category,
            value: newPromptElement.value.trim()
        };

        // 既存のプロンプト要素に新しい要素を追加
        setCanvasSettings(prev => ({
            ...prev,
            promptElements: [...(prev.promptElements || []), newElement]
        }));

        // 入力フォームをリセット（カテゴリはそのままで値のみクリア）
        setNewPromptElement(prev => ({ ...prev, value: "" }));
    };

    /**
     * プロンプト要素を削除する関数
     * @param id 削除する要素のID
     */
    const removePromptElement = (id: string) => {
        setCanvasSettings(prev => ({
            ...prev,
            promptElements: (prev.promptElements || []).filter(elem => elem.id !== id)
        }));
    };

    // プルダウンで選択したカテゴリの表示名を取得する関数
    const getCategoryLabel = (categoryValue: string): string => {
        const category = promptElementCategories.find(cat => cat.value === categoryValue);
        return category ? category.label : categoryValue;
    };

    /**
     * YAMLテキストをクリップボードにコピーする関数
     */
    const copyToClipboard = () => {
        try {
            // YAMLテキストを生成
            const yamlText = generateYaml(notes, canvasSettings);
            // クリップボードAPIを使用してテキストをコピー
            navigator.clipboard.writeText(yamlText)
                .then(() => {
                    // コピー成功時の処理
                    showToast('YAMLをクリップボードにコピーしました', 'success');
                })
                .catch((error) => {
                    console.error("クリップボードへのコピーに失敗しました:", error);
                    showToast('コピーに失敗しました', 'error');
                });
        } catch (error) {
            console.error("YAML生成中にエラーが発生しました:", error);
            showToast('YAML生成中にエラーが発生しました', 'error');
        }
    };
    
    /**
     * YAMLをファイルとしてダウンロード
     */
    const downloadYaml = () => {
        try {
            const yamlText = generateYaml(notes, canvasSettings);
            const blob = new Blob([yamlText], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompt-${Date.now()}.yaml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('YAMLファイルをダウンロードしました', 'success');
        } catch (error) {
            console.error('Download failed:', error);
            showToast('ダウンロードに失敗しました', 'error');
        }
    };
    
    /**
     * すべての付箋をクリア
     */
    const clearAllNotes = () => {
        if (notes.length === 0) return;
        if (confirm(`すべての付箋(${notes.length}個)を削除してもよろしいですか？`)) {
            setNotes([]);
            addToHistory([]);
            showToast('すべての付箋を削除しました', 'success');
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Toast Notification */}
            {toastMessage && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg toast-notification ${
                    toastType === 'success' ? 'bg-green-500' : 
                    toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'
                } text-white font-medium`}>
                    {toastMessage}
                </div>
            )}
            
            {/* キャンバスエリア */}
            <div
                className="relative flex flex-col flex-grow-2"
                ref={canvasContainerRef}
            >
                {/* Enhanced ツールバー */}
                <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                    <div className="flex items-center justify-between">
                        {/* Left section - Canvas settings */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-white font-medium">🎨</span>
                                <label className="text-white font-medium">
                                    アスペクト比:
                                    <select
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value)}
                                        className="p-2 ml-2 text-black bg-white border-2 border-white/30 rounded-lg focus:ring-2 focus:ring-purple-300 transition-all"
                                    >
                                        <option value="16:9">16:9 (ワイド)</option>
                                        <option value="4:3">4:3 (標準)</option>
                                        <option value="1:1">1:1 (正方形)</option>
                                        <option value="custom">カスタム</option>
                                    </select>
                                </label>
                                {aspectRatio === "custom" && (
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            placeholder="幅"
                                            value={customSize.width}
                                            onChange={(e) =>
                                                setCustomSize({
                                                    ...customSize,
                                                    width: Number(e.target.value),
                                                })
                                            }
                                            className="w-24 p-2 text-black bg-white border-2 border-white/30 rounded-lg focus:ring-2 focus:ring-purple-300"
                                        />
                                        <span className="text-white">×</span>
                                        <input
                                            type="number"
                                            placeholder="高さ"
                                            value={customSize.height}
                                            onChange={(e) =>
                                                setCustomSize({
                                                    ...customSize,
                                                    height: Number(e.target.value),
                                                })
                                            }
                                            className="w-24 p-2 text-black bg-white border-2 border-white/30 rounded-lg focus:ring-2 focus:ring-purple-300"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Right section - Actions */}
                        <div className="flex items-center space-x-2">
                            {/* Undo/Redo buttons */}
                            <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
                                <button
                                    onClick={undo}
                                    disabled={historyIndex <= 0}
                                    className="px-3 py-2 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                                    title="元に戻す (Ctrl+Z)"
                                >
                                    ↶
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={historyIndex >= history.length - 1}
                                    className="px-3 py-2 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                                    title="やり直し (Ctrl+Y)"
                                >
                                    ↷
                                </button>
                            </div>
                            
                            {/* Clear all button */}
                            <button
                                onClick={clearAllNotes}
                                disabled={notes.length === 0}
                                className="px-4 py-2 text-white bg-red-500/80 rounded-lg hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium shadow-md"
                                title="すべての付箋を削除"
                            >
                                🗑️ クリア
                            </button>
                            
                            {/* Add note dropdown */}
                            <div className="dropdown">
                                <button
                                    className="flex items-center space-x-2 px-4 py-2 text-white bg-white/20 rounded-lg hover:bg-white/30 transition-all font-medium shadow-md backdrop-blur-sm"
                                >
                                    <span>➕ 新規付箋</span>
                                    <span>▼</span>
                                </button>
                                <div className="absolute hidden mt-2 bg-white border-2 border-purple-200 rounded-lg shadow-xl dropdown-content min-w-[200px] overflow-hidden">
                                    <button onClick={() => addNewNote("plain")} className="block w-full px-4 py-3 text-left text-black hover:bg-purple-50 transition-colors border-b border-gray-100">📝 プレーンテキスト</button>
                                    <button onClick={() => addNewNote("character")} className="block w-full px-4 py-3 text-left text-black hover:bg-blue-50 transition-colors border-b border-gray-100">👤 キャラクター</button>
                                    <button onClick={() => addNewNote("place")} className="block w-full px-4 py-3 text-left text-black hover:bg-green-50 transition-colors border-b border-gray-100">📍 場所</button>
                                    <button onClick={() => addNewNote("event")} className="block w-full px-4 py-3 text-left text-black hover:bg-purple-50 transition-colors border-b border-gray-100">⚡ イベント</button>
                                    <button onClick={() => addNewNote("item")} className="block w-full px-4 py-3 text-left text-black hover:bg-yellow-50 transition-colors border-b border-gray-100">🎁 アイテム</button>
                                    <button onClick={() => addNewNote("emotion")} className="block w-full px-4 py-3 text-left text-black hover:bg-pink-50 transition-colors border-b border-gray-100">💭 感情</button>
                                    <button onClick={() => addNewNote("memo")} className="block w-full px-4 py-3 text-left text-black hover:bg-gray-50 transition-colors">📋 メモ</button>
                                </div>
                            </div>
                            
                            {/* Quick add button */}
                            <button
                                onClick={() => addNewNote()}
                                className="px-4 py-2 text-white btn-gradient-success rounded-lg font-medium shadow-md"
                                title="プレーン付箋を追加"
                            >
                                ➕ 付箋追加
                            </button>
                        </div>
                    </div>
                </div>

                {/* Enhanced キャンバス全体のプロンプト設定セクション */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200 shadow-sm">
                    <div className="flex items-center mb-3">
                        <span className="text-lg mr-2">⚙️</span>
                        <h3 className="text-base font-bold text-gray-800">キャンバス全体の設定</h3>
                    </div>

                    {/* プロンプト要素追加フォーム */}
                    <div className="flex items-center mb-3 space-x-2">
                        <select
                            value={newPromptElement.category}
                            onChange={(e) => setNewPromptElement({
                                ...newPromptElement,
                                category: e.target.value
                            })}
                            className="p-2 text-black bg-white border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all shadow-sm"
                        >
                            {promptElementCategories.map(category => (
                                <option key={category.value} value={category.value}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder={`${getCategoryLabel(newPromptElement.category)}を入力...`}
                            value={newPromptElement.value}
                            onChange={(e) => setNewPromptElement({
                                ...newPromptElement,
                                value: e.target.value
                            })}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && newPromptElement.value.trim()) {
                                    addPromptElement();
                                }
                            }}
                            className="flex-grow p-2 text-black bg-white border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all shadow-sm"
                        />
                        <button
                            onClick={addPromptElement}
                            className="px-5 py-2 text-white btn-gradient-primary rounded-lg font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!newPromptElement.value.trim()}
                        >
                            ➕ 追加
                        </button>
                    </div>

                    {/* 追加されたプロンプト要素のリスト */}
                    <div className="flex flex-wrap gap-2">
                        {canvasSettings.promptElements && canvasSettings.promptElements.length > 0 ? (
                            canvasSettings.promptElements.map(element => (
                                <div key={element.id} className="flex items-center px-3 py-2 bg-white border-2 border-purple-200 rounded-full shadow-sm hover:shadow-md transition-all group">
                                    <span className="mr-2 text-xs font-bold text-purple-600 uppercase">
                                        {getCategoryLabel(element.category)}
                                    </span>
                                    <span className="text-sm text-gray-700 font-medium">{element.value}</span>
                                    <button
                                        onClick={() => removePromptElement(element.id)}
                                        className="ml-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-6 h-6 flex items-center justify-center transition-all opacity-70 group-hover:opacity-100"
                                        title="削除"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center py-4 px-6 bg-white/50 rounded-lg border-2 border-dashed border-purple-200">
                                <span className="text-sm text-gray-500">💡 上のフォームから画風や雰囲気などの要素を追加できます</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced キャンバス枠 */}
                <div className="flex items-center justify-center flex-grow p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div
                        className="relative bg-white rounded-xl shadow-2xl border-4 border-purple-200"
                        style={{
                            width: `${canvasDimensions.width}px`,
                            height: `${canvasDimensions.height}px`,
                        }}
                    >
                        {/* Canvas info overlay */}
                        <div className="absolute top-2 right-2 px-3 py-1 bg-black/10 backdrop-blur-sm rounded-lg text-xs text-gray-600 font-medium">
                            {canvasDimensions.width} × {canvasDimensions.height} px | {notes.length} 付箋
                        </div>
                        
                        {/* キャンバス上の付箋 */}
                        {notes.map((note) => (
                            <StickyNote
                                key={note.id}
                                note={note}
                                updateNote={(id, props) => {
                                    updateNote(id, props);
                                    const newNotes = notes.map(n => n.id === id ? { ...n, ...props } : n);
                                    addToHistory(newNotes);
                                }}
                                canvasDimensions={canvasDimensions}
                                onDelete={deleteNote}
                                onDuplicate={duplicateNote}
                            />
                        ))}
                        
                        {/* Empty state */}
                        {notes.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-8 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
                                    <div className="text-6xl mb-4">📝</div>
                                    <h3 className="text-xl font-bold text-gray-700 mb-2">付箋を追加して始めましょう</h3>
                                    <p className="text-gray-500 text-sm">上部の「➕ 付箋追加」ボタンをクリックしてください</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced YAML プレビューエリア */}
            <div className="flex-grow-1 bg-white border-l-4 border-purple-200 flex flex-col shadow-xl">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">📄</span>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                YAML Preview
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center space-x-2 px-4 py-2 text-white btn-gradient-success rounded-lg font-medium shadow-md flex-1"
                            title="YAMLをクリップボードにコピー"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            <span>コピー</span>
                        </button>
                        <button
                            onClick={downloadYaml}
                            className="flex items-center space-x-2 px-4 py-2 text-white btn-gradient-primary rounded-lg font-medium shadow-md flex-1"
                            title="YAMLファイルをダウンロード"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>保存</span>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                    <pre className="p-4 text-sm text-gray-800 border-2 border-purple-100 rounded-xl bg-white shadow-inner yaml-preview font-mono leading-relaxed whitespace-pre-wrap break-words">
                        {generateYaml(notes, canvasSettings)}
                    </pre>
                </div>
                
                {/* Help section */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-purple-200">
                    <details className="cursor-pointer">
                        <summary className="font-bold text-gray-700 mb-2 flex items-center space-x-2">
                            <span>💡</span>
                            <span>ショートカットキー</span>
                        </summary>
                        <div className="mt-3 space-y-1 text-sm text-gray-600 ml-6">
                            <div><kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs font-mono">Ctrl+Z</kbd> - 元に戻す</div>
                            <div><kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs font-mono">Ctrl+Y</kbd> - やり直し</div>
                            <div><kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs font-mono">Delete</kbd> - 選択した付箋を削除</div>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default VisualYamlEditor;
