'use client';

import React, { useState, useEffect } from "react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import {
    StickyNoteProps,
    CharacterDetails,
    PlaceDetails,
    EventDetails,
    ItemDetails,
    EmotionDetails
} from "../types";

/**
 * 付箋ノートを表示するドラッガブルなコンポーネント
 * @param props StickyNoteProps - note情報と更新関数、キャンバス寸法
 */
const StickyNote = ({ note, updateNote, canvasDimensions, onDelete, onDuplicate }: StickyNoteProps) => {
    const [type, setType] = useState(note.type || "plain");
    const [content, setContent] = useState(note.content || "");

    // 各タイプの詳細情報の状態管理
    const [characterDetails, setCharacterDetails] = useState<CharacterDetails>(
        note.characterDetails || { gender: "", age: "" }
    );
    const [eventDetails, setEventDetails] = useState<EventDetails>(
        note.eventDetails || { time: "", importance: "" }
    );
    const [itemDetails, setItemDetails] = useState<ItemDetails>(
        note.itemDetails || { category: "", importance: "" }
    );
    const [emotionDetails, setEmotionDetails] = useState<EmotionDetails>(
        note.emotionDetails || { intensity: "", trigger: "" }
    );
    const [placeDetails, setPlaceDetails] = useState<PlaceDetails>(
        note.placeDetails || { location: "", atmosphere: "" }
    );

    // 付箋タイプが変更された時に自動的に詳細情報を追加する
    useEffect(() => {
        // 適切な詳細情報をタイプに応じて追加する
        const updateDetailsByType = () => {
            switch (type) {
                case "character":
                    updateNote(note.id, { characterDetails });
                    break;
                case "place":
                    updateNote(note.id, { placeDetails });
                    break;
                case "event":
                    updateNote(note.id, { eventDetails });
                    break;
                case "item":
                    updateNote(note.id, { itemDetails });
                    break;
                case "emotion":
                    updateNote(note.id, { emotionDetails });
                    break;
            }
        };

        updateDetailsByType();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    // 付箋属性の変更
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value;
        setType(newType);
        updateNote(note.id, { type: newType });
    };

    // プレーンテキスト入力の変更
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        updateNote(note.id, { content: e.target.value });
    };

    // キャラクター用詳細情報の変更
    const handleCharacterDetailChange = (field: keyof CharacterDetails, value: string) => {
        const newDetails = { ...characterDetails, [field]: value };
        setCharacterDetails(newDetails);
        updateNote(note.id, { characterDetails: newDetails });
    };

    // イベント詳細情報の変更
    const handleEventDetailChange = (field: keyof EventDetails, value: string) => {
        const newDetails = { ...eventDetails, [field]: value };
        setEventDetails(newDetails);
        updateNote(note.id, { eventDetails: newDetails });
    };

    // アイテム詳細情報の変更
    const handleItemDetailChange = (field: keyof ItemDetails, value: string) => {
        const newDetails = { ...itemDetails, [field]: value };
        setItemDetails(newDetails);
        updateNote(note.id, { itemDetails: newDetails });
    };

    // 感情詳細情報の変更
    const handleEmotionDetailChange = (field: keyof EmotionDetails, value: string) => {
        const newDetails = { ...emotionDetails, [field]: value };
        setEmotionDetails(newDetails);
        updateNote(note.id, { emotionDetails: newDetails });
    };

    // 場所詳細情報の変更
    const handlePlaceDetailChange = (field: keyof PlaceDetails, value: string) => {
        const newDetails = { ...placeDetails, [field]: value };
        setPlaceDetails(newDetails);
        updateNote(note.id, { placeDetails: newDetails });
    };

    /**
     * キャンバス内に座標を制限する関数
     * @param x X座標
     * @param y Y座標
     * @returns キャンバス内に制限されたX,Y座標
     */
    const constrainToCanvas = (x: number, y: number) => {
        return {
            x: Math.max(0, Math.min(x, canvasDimensions.width - note.width)),
            y: Math.max(0, Math.min(y, canvasDimensions.height - note.height))
        };
    };

    // 付箋タイプに基づいて背景色を決定する関数
    const getNoteBackgroundColor = () => {
        switch (type) {
            case "character": return "bg-gradient-to-br from-blue-100 to-blue-200";
            case "place": return "bg-gradient-to-br from-green-100 to-green-200";
            case "event": return "bg-gradient-to-br from-purple-100 to-purple-200";
            case "item": return "bg-gradient-to-br from-yellow-100 to-yellow-200";
            case "emotion": return "bg-gradient-to-br from-pink-100 to-pink-200";
            case "memo": return "bg-gradient-to-br from-gray-100 to-gray-200";
            default: return "bg-gradient-to-br from-yellow-50 to-yellow-100";
        }
    };
    
    // 付箋タイプに応じたアイコンを取得
    const getNoteIcon = () => {
        switch (type) {
            case "character": return "👤";
            case "place": return "📍";
            case "event": return "⚡";
            case "item": return "🎁";
            case "emotion": return "💭";
            case "memo": return "📋";
            default: return "📝";
        }
    };

    return (
        <div className="absolute" style={{ left: note.x, top: note.y }}>
            <ResizableBox
                width={note.width}
                height={note.height}
                onResizeStop={(_e, { size }) => {
                    // リサイズ後のサイズを更新（キャンバス境界を考慮）
                    const newWidth = size.width;
                    const newHeight = size.height;
                    const constrainedX = Math.min(note.x, canvasDimensions.width - newWidth);
                    const constrainedY = Math.min(note.y, canvasDimensions.height - newHeight);

                    updateNote(note.id, {
                        width: newWidth,
                        height: newHeight,
                        x: constrainedX,
                        y: constrainedY
                    });
                }}
                minConstraints={[150, 150]}
                resizeHandles={["se"]}
                // リサイズの最大サイズをキャンバスサイズに基づいて制限
                maxConstraints={[
                    canvasDimensions.width - note.x,
                    canvasDimensions.height - note.y
                ]}
            >
                <div
                    className={`border-2 border-gray-300 p-3 h-full box-border text-black ${getNoteBackgroundColor()} rounded-lg shadow-lg hover:shadow-xl transition-all sticky-note-enter`}
                    style={{ height: '100%' }}
                >
                    <div className="sticky-note-header flex justify-between items-start mb-2 gap-2">
                        <div className="flex items-center space-x-2 flex-1">
                            <span className="text-lg">{getNoteIcon()}</span>
                            <select
                                value={type}
                                onChange={handleTypeChange}
                                className="flex-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-1.5 font-medium shadow-sm hover:bg-white transition-all focus:ring-2 focus:ring-purple-300"
                            >
                                <option value="plain">プレーンテキスト</option>
                                <option value="character">キャラクター</option>
                                <option value="place">場所</option>
                                <option value="event">イベント</option>
                                <option value="item">アイテム</option>
                                <option value="emotion">感情</option>
                                <option value="memo">メモ</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-1">
                            {onDuplicate && (
                                <button
                                    onClick={() => onDuplicate(note.id)}
                                    className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all shadow-sm"
                                    title="複製"
                                >
                                    📋
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => {
                                        if (confirm('この付箋を削除してもよろしいですか？')) {
                                            onDelete(note.id);
                                        }
                                    }}
                                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-all shadow-sm"
                                    title="削除"
                                >
                                    🗑️
                                </button>
                            )}
                            <div
                                className="cursor-move drag-handle p-1.5 bg-gray-700 text-white rounded hover:bg-gray-800 transition-all shadow-sm font-bold"
                                onMouseDown={(e) => {
                                e.preventDefault(); // テキスト選択を防止
                                const startPos = { x: e.clientX, y: e.clientY };
                                const startNotePos = { x: note.x, y: note.y };

                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                    const deltaX = moveEvent.clientX - startPos.x;
                                    const deltaY = moveEvent.clientY - startPos.y;

                                    // キャンバス境界内に制限
                                    const newPos = constrainToCanvas(
                                        startNotePos.x + deltaX,
                                        startNotePos.y + deltaY
                                    );

                                    updateNote(note.id, newPos);
                                };

                                const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                };

                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                            }}
                            title="ドラッグして移動"
                        >
                            ⋮⋮
                        </div>
                        </div>
                    </div>

                    {/* タイプに応じた詳細入力フォームを表示 */}
                    {type === "character" && (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="性別"
                                value={characterDetails.gender}
                                onChange={(e) =>
                                    handleCharacterDetailChange(
                                        "gender",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-300 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="年齢"
                                value={characterDetails.age}
                                onChange={(e) =>
                                    handleCharacterDetailChange(
                                        "age",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-300 transition-all"
                            />
                        </div>
                    )}

                    {/* 場所の詳細フォーム */}
                    {type === "place" && (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="ロケーション"
                                value={placeDetails.location}
                                onChange={(e) =>
                                    handlePlaceDetailChange(
                                        "location",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="雰囲気"
                                value={placeDetails.atmosphere}
                                onChange={(e) =>
                                    handlePlaceDetailChange(
                                        "atmosphere",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                        </div>
                    )}

                    {/* イベントの詳細フォーム */}
                    {type === "event" && (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="時間・タイミング"
                                value={eventDetails.time}
                                onChange={(e) =>
                                    handleEventDetailChange(
                                        "time",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                            <select
                                value={eventDetails.importance}
                                onChange={(e) =>
                                    handleEventDetailChange(
                                        "importance",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 transition-all"
                            >
                                <option value="">重要度を選択</option>
                                <option value="high">高 (メインイベント)</option>
                                <option value="medium">中 (サブイベント)</option>
                                <option value="low">低 (背景イベント)</option>
                            </select>
                        </div>
                    )}

                    {/* アイテムの詳細フォーム */}
                    {type === "item" && (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="カテゴリー"
                                value={itemDetails.category}
                                onChange={(e) =>
                                    handleItemDetailChange(
                                        "category",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                            <select
                                value={itemDetails.importance}
                                onChange={(e) =>
                                    handleItemDetailChange(
                                        "importance",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 transition-all"
                            >
                                <option value="">重要度を選択</option>
                                <option value="key">重要アイテム</option>
                                <option value="normal">通常アイテム</option>
                                <option value="background">背景小物</option>
                            </select>
                        </div>
                    )}

                    {/* 感情の詳細フォーム */}
                    {type === "emotion" && (
                        <div className="space-y-2">
                            <select
                                value={emotionDetails.intensity}
                                onChange={(e) =>
                                    handleEmotionDetailChange(
                                        "intensity",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 transition-all"
                            >
                                <option value="">強度を選択</option>
                                <option value="strong">強</option>
                                <option value="medium">中</option>
                                <option value="weak">弱</option>
                            </select>
                            <input
                                type="text"
                                placeholder="きっかけ・原因"
                                value={emotionDetails.trigger}
                                onChange={(e) =>
                                    handleEmotionDetailChange(
                                        "trigger",
                                        e.target.value
                                    )
                                }
                                className="w-full mb-1 text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                        </div>
                    )}

                    {/* 常に表示されるプレーンテキスト入力欄 */}
                    <textarea
                        placeholder="プロンプト内容を入力..."
                        value={content}
                        onChange={handleContentChange}
                        className="w-full text-sm text-black bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg p-2 mt-2 focus:ring-2 focus:ring-purple-300 transition-all resize-none"
                        style={{
                            height: type === "plain" || type === "memo" ? "80%" : "40%"
                        }}
                    />
                </div>
            </ResizableBox>
        </div>
    );
};

export default StickyNote;
