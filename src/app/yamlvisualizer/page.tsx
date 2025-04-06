'use client';

import React, { useState, useEffect, useRef } from "react";
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
        setNotes([...notes, newNote]);
    };

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

    return (
        <div className="flex h-screen">
            {/* キャンバスエリア */}
            <div
                className="relative flex flex-col bg-gray-100 flex-grow-2"
                ref={canvasContainerRef}
            >
                {/* ツールバー：アスペクト比設定 */}
                <div className="p-2.5 bg-gray-300 flex items-center">
                    <label className="mr-2 text-black">
                        アスペクト比:
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="p-1 ml-2 text-black bg-white border border-gray-300 rounded"
                        >
                            <option value="16:9">16:9</option>
                            <option value="4:3">4:3</option>
                            <option value="1:1">1:1</option>
                            <option value="custom">カスタム</option>
                        </select>
                    </label>
                    {aspectRatio === "custom" && (
                        <span className="flex items-center">
                            <input
                                type="number"
                                placeholder="幅(px)"
                                value={customSize.width}
                                onChange={(e) =>
                                    setCustomSize({
                                        ...customSize,
                                        width: Number(e.target.value),
                                    })
                                }
                                className="w-20 p-1 ml-2 text-black bg-white border border-gray-300 rounded"
                            />
                            <input
                                type="number"
                                placeholder="高さ(px)"
                                value={customSize.height}
                                onChange={(e) =>
                                    setCustomSize({
                                        ...customSize,
                                        height: Number(e.target.value),
                                    })
                                }
                                className="w-20 p-1 ml-2 text-black bg-white border border-gray-300 rounded"
                            />
                        </span>
                    )}
                    <div className="flex ml-auto">
                        <div className="mr-2 dropdown">
                            <button
                                className="flex items-center px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                            >
                                新規付箋追加 <span className="ml-1">▼</span>
                            </button>
                            <div className="absolute hidden mt-1 bg-white border border-gray-200 rounded shadow-lg dropdown-content">
                                <button onClick={() => addNewNote("plain")} className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100">プレーンテキスト</button>
                                <button onClick={() => addNewNote("character")} className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100">キャラクター</button>
                                <button onClick={() => addNewNote("place")} className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100">場所</button>
                                <button onClick={() => addNewNote("event")} className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100">イベント</button>
                                <button onClick={() => addNewNote("item")} className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100">アイテム</button>
                                <button onClick={() => addNewNote("emotion")} className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100">感情</button>
                                <button onClick={() => addNewNote("memo")} className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100">メモ</button>
                            </div>
                        </div>
                        <button
                            onClick={() => addNewNote()}
                            className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                        >
                            付箋追加
                        </button>
                    </div>
                </div>

                {/* キャンバス全体のプロンプト設定セクション */}
                <div className="p-2.5 bg-gray-200 border-t border-gray-300">
                    <h3 className="mb-2 text-sm font-medium text-black">キャンバス全体の設定</h3>

                    {/* プロンプト要素追加フォーム */}
                    <div className="flex items-center mb-2">
                        <select
                            value={newPromptElement.category}
                            onChange={(e) => setNewPromptElement({
                                ...newPromptElement,
                                category: e.target.value
                            })}
                            className="p-1 mr-2 text-black bg-white border border-gray-300 rounded"
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
                            className="flex-grow p-1 mr-2 text-black bg-white border border-gray-300 rounded"
                        />
                        <button
                            onClick={addPromptElement}
                            className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                            disabled={!newPromptElement.value.trim()}
                        >
                            追加
                        </button>
                    </div>

                    {/* 追加されたプロンプト要素のリスト */}
                    <div className="flex flex-wrap gap-2">
                        {canvasSettings.promptElements && canvasSettings.promptElements.map(element => (
                            <div key={element.id} className="flex items-center px-2 py-1 bg-white border border-gray-300 rounded">
                                <span className="mr-1 text-xs font-medium text-gray-500">
                                    {getCategoryLabel(element.category)}:
                                </span>
                                <span className="text-sm text-black">{element.value}</span>
                                <button
                                    onClick={() => removePromptElement(element.id)}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    title="削除"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {(!canvasSettings.promptElements || canvasSettings.promptElements.length === 0) && (
                            <span className="text-sm italic text-gray-500">設定なし - 上のフォームから要素を追加してください</span>
                        )}
                    </div>
                </div>

                {/* キャンバス枠 - アスペクト比に合わせた表示 */}
                <div className="flex items-center justify-center flex-grow p-5">
                    <div
                        className="relative bg-white border-2 border-blue-500 shadow-md"
                        style={{
                            width: `${canvasDimensions.width}px`,
                            height: `${canvasDimensions.height}px`,
                        }}
                    >
                        {/* キャンバス上の付箋 */}
                        {notes.map((note) => (
                            <StickyNote
                                key={note.id}
                                note={note}
                                updateNote={updateNote}
                                canvasDimensions={canvasDimensions}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* YAML プレビューエリア */}
            <div className="flex-grow-1 bg-white border-l border-gray-300 p-2.5 overflow-auto">
                <h2 className="mb-2 text-xl font-bold text-black font-jp">YAML Preview</h2>
                <pre className="p-2 text-black border border-gray-200 rounded bg-gray-50 yaml-preview">{generateYaml(notes, canvasSettings)}</pre>
            </div>
        </div>
    );
};

export default VisualYamlEditor;
