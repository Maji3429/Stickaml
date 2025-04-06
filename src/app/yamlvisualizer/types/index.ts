// YAMLビジュアライザーで使用する型定義

/**
 * キャラクター詳細情報の型定義
 */
export interface CharacterDetails {
    gender: string;
    age: string;
}

/**
 * 場所詳細情報の型定義
 */
export interface PlaceDetails {
    location: string;
    atmosphere: string;
}

/**
 * イベント詳細情報の型定義
 */
export interface EventDetails {
    time: string;
    importance: string;
}

/**
 * アイテム詳細情報の型定義
 */
export interface ItemDetails {
    category: string;
    importance: string;
}

/**
 * 感情詳細情報の型定義
 */
export interface EmotionDetails {
    intensity: string;
    trigger: string;
}

/**
 * キャンバス全体のプロンプト要素を表す型定義
 */
export interface CanvasPromptElement {
    id: string;
    category: string; // 要素のカテゴリ
    value: string; // 要素の値
}

/**
 * 付箋ノートの型定義
 */
export interface Note {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    content: string;
    characterDetails?: CharacterDetails;
    placeDetails?: PlaceDetails;
    eventDetails?: EventDetails;
    itemDetails?: ItemDetails;
    emotionDetails?: EmotionDetails;
}

/**
 * キャンバスの寸法情報を表す型定義
 */
export interface CanvasDimensions {
    width: number;
    height: number;
}

/**
 * キャンバス設定情報を表す型定義
 */
export interface CanvasSettings {
    aspectRatio: string;
    width: number;
    height: number;
    customWidth?: number;
    customHeight?: number;
    promptElements?: CanvasPromptElement[]; // キャンバス全体のプロンプト要素リスト
}

/**
 * StickyNoteコンポーネントのProps型定義
 */
export interface StickyNoteProps {
    note: Note;
    updateNote: (id: number, updatedProperties: Partial<Note>) => void;
    canvasDimensions: CanvasDimensions; // キャンバスの寸法情報を追加
}
