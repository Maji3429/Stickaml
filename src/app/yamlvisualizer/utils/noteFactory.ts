import {
    Note,
    CharacterDetails,
    PlaceDetails,
    EventDetails,
    ItemDetails,
    EmotionDetails
} from "../types";

/**
 * 付箋ノート生成のためのファクトリークラス
 * 新しいタイプの付箋を簡単に追加できる設計
 */
export class NoteFactory {
    /**
     * 付箋タイプに対応した詳細情報を持つ付箋を生成する
     * @param type 付箋タイプ
     * @param id 付箋ID
     * @param x X座標
     * @param y Y座標
     * @param width 幅
     * @param height 高さ
     * @param content 内容
     * @returns 適切な詳細情報を持つ付箋オブジェクト
     */
    static createNote(
        type: string,
        id: number,
        x: number = 100,
        y: number = 100,
        width: number = 250,
        height: number = 150,
        content: string = ""
    ): Note {
        // 基本の付箋データ
        const baseNote: Note = {
            id,
            x,
            y,
            width,
            height,
            type,
            content
        };

        // タイプに応じた詳細情報を追加
        switch (type) {
            case "character":
                return {
                    ...baseNote,
                    characterDetails: { gender: "", age: "" } as CharacterDetails
                };
            case "place":
                return {
                    ...baseNote,
                    placeDetails: { location: "", atmosphere: "" } as PlaceDetails
                };
            case "event":
                return {
                    ...baseNote,
                    eventDetails: { time: "", importance: "" } as EventDetails
                };
            case "item":
                return {
                    ...baseNote,
                    itemDetails: { category: "", importance: "" } as ItemDetails
                };
            case "emotion":
                return {
                    ...baseNote,
                    emotionDetails: { intensity: "", trigger: "" } as EmotionDetails
                };
            default:
                return baseNote;
        }
    }

    /**
     * 新しい付箋タイプを動的に追加するための拡張ポイント
     * 具体的な実装は今後の要件に応じて追加可能
     */
    static registerNoteType(typeName: string, detailsTemplate: object) {
        // 将来的に新しい付箋タイプを動的に登録する機能を実装できるようにする準備
        console.log(`将来の拡張: ${typeName}タイプの登録`, detailsTemplate);
    }

    /**
     * 付箋タイプに応じた背景色のCSSクラス名を取得する
     * @param type 付箋タイプ
     * @returns 背景色のCSSクラス名
     */
    static getBackgroundColorClass(type: string): string {
        const colorMap: { [key: string]: string } = {
            "character": "bg-blue-100",
            "place": "bg-green-100",
            "event": "bg-purple-100",
            "item": "bg-yellow-100",
            "emotion": "bg-pink-100",
            "memo": "bg-gray-100",
            "plain": "bg-sticky-yellow"
        };

        return colorMap[type] || "bg-sticky-yellow";
    }
}
