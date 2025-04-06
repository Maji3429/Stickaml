'use client';

import React, { useState } from "react";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

// 付箋ノートの型定義
interface CharacterDetails {
    gender: string;
    age: string;
}

interface Note {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    content: string;
    characterDetails?: CharacterDetails;
}

// PropsとEventの型定義
interface StickyNoteProps {
    note: Note;
    updateNote: (id: number, updatedProperties: Partial<Note>) => void;
}

const StickyNote = ({ note, updateNote }: StickyNoteProps) => {
    const draggableRef = React.useRef<HTMLDivElement>(null); // Draggable用の参照を定義
    const [type, setType] = useState(note.type || "plain");
    const [content, setContent] = useState(note.content || "");
    const [characterDetails, setCharacterDetails] = useState<CharacterDetails>(
        note.characterDetails || { gender: "", age: "" }
    );

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

    return (
        <Draggable
            nodeRef={draggableRef}
            cancel=".react-resizable-handle"
            position={{ x: note.x, y: note.y }}
            onStop={(_e, data) => updateNote(note.id, { x: data.x, y: data.y })}
        >
            <div ref={draggableRef}>
                <ResizableBox
                    width={note.width}
                    height={note.height}
                    onResizeStop={(_e, { size }) =>
                        updateNote(note.id, {
                            width: size.width,
                            height: size.height,
                        })
                    }
                    minConstraints={[150, 150]}
                    resizeHandles={["se"]}
                >
                    <div
                        className="border border-gray-300 bg-sticky-yellow p-2.5 h-full box-border text-black"
                        style={{ height: '100%' }}
                    >
                        <select
                            value={type}
                            onChange={handleTypeChange}
                            className="w-full mb-2 text-black bg-white border border-gray-300 rounded p-1"
                        >
                            <option value="plain">プレーンテキスト</option>
                            <option value="character">キャラクター</option>
                            <option value="place">場所</option>
                        </select>
                        {/* キャラクター選択の場合は追加フォームを表示 */}
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
                                    className="w-full mb-1 text-black bg-white border border-gray-300 rounded p-1"
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
                                    className="w-full mb-1 text-black bg-white border border-gray-300 rounded p-1"
                                />
                            </div>
                        )}
                        {/* 常に表示されるプレーンテキスト入力欄 */}
                        <textarea
                            placeholder="プロンプト内容を入力"
                            value={content}
                            onChange={handleContentChange}
                            className="w-full h-12 text-black bg-white border border-gray-300 rounded p-1 mt-2"
                        />
                    </div>
                </ResizableBox>
            </div>
        </Draggable>
    );
};

const VisualYamlEditor = () => {
    const [notes, setNotes] = useState<Note[]>([
        {
            id: 1,
            x: 50,
            y: 50,
            width: 250,
            height: 150,
            type: "plain",
            content: "例: 青い空と緑の草原",
        },
    ]);
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [customSize, setCustomSize] = useState({ width: 800, height: 450 });

    // 付箋更新関数
    const updateNote = (id: number, updatedProperties: Partial<Note>) => {
        setNotes((prevNotes) =>
            prevNotes.map((note) =>
                note.id === id ? { ...note, ...updatedProperties } : note
            )
        );
    };

    // YAML を生成（付箋の位置、大きさ、内容を反映）
    const generateYaml = () => {
        let yaml = "elements:\n";
        notes.forEach((note) => {
            yaml += `  - id: ${note.id}\n`;
            yaml += `    type: ${note.type}\n`;
            yaml += `    position: { x: ${note.x}, y: ${note.y} }\n`;
            yaml += `    size: { width: ${note.width}, height: ${note.height} }\n`;
            yaml += `    content: "${note.content}"\n`;
            if (note.type === "character" && note.characterDetails) {
                yaml += `    characterDetails:\n`;
                yaml += `      gender: "${note.characterDetails.gender || ""}"\n`;
                yaml += `      age: "${note.characterDetails.age || ""}"\n`;
            }
        });
        return yaml;
    };

    // 新しい付箋を追加する関数
    const addNewNote = () => {
        const newId = Math.max(0, ...notes.map(note => note.id)) + 1;
        setNotes([
            ...notes,
            {
                id: newId,
                x: 100,
                y: 100,
                width: 250,
                height: 150,
                type: "plain",
                content: "",
            }
        ]);
    };

    return (
        <div className="flex h-screen">
            {/* キャンバスエリア */}
            <div className="flex-grow-2 relative bg-gray-100">
                {/* ツールバー：アスペクト比設定 */}
                <div className="p-2.5 bg-gray-300 flex items-center">
                    <label className="mr-2 text-black">
                        アスペクト比:
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="ml-2 text-black bg-white border border-gray-300 rounded p-1"
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
                                className="w-20 ml-2 text-black bg-white border border-gray-300 rounded p-1"
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
                                className="w-20 ml-2 text-black bg-white border border-gray-300 rounded p-1"
                            />
                        </span>
                    )}
                    <button
                        onClick={addNewNote}
                        className="ml-auto bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                    >
                        新規付箋追加
                    </button>
                </div>
                {/* キャンバス上の付箋 */}
                {notes.map((note) => (
                    <StickyNote
                        key={note.id}
                        note={note}
                        updateNote={updateNote}
                    />
                ))}
            </div>
            {/* YAML プレビューエリア */}
            <div className="flex-grow-1 bg-white border-l border-gray-300 p-2.5 overflow-auto">
                <h2 className="text-xl font-bold mb-2 text-black">YAML Preview</h2>
                <pre className="bg-gray-50 p-2 rounded border border-gray-200 text-black">{generateYaml()}</pre>
            </div>
        </div>
    );
};

export default VisualYamlEditor;
