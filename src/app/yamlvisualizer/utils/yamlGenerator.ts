import { Note, CanvasSettings } from "../types";

/**
 * キャンバス設定とノートの配列からYAML形式の文字列を生成する
 * @param notes 付箋ノートの配列
 * @param canvasSettings キャンバス設定情報
 * @returns YAML形式の文字列
 */
export const generateYaml = (notes: Note[], canvasSettings: CanvasSettings): string => {
    let yaml = "canvas:\n";
    yaml += `  aspectRatio: "${canvasSettings.aspectRatio}"\n`;
    yaml += `  width: ${canvasSettings.width}\n`;
    yaml += `  height: ${canvasSettings.height}\n`;

    // カスタムサイズの場合は追加情報を記録
    if (canvasSettings.aspectRatio === "custom" && canvasSettings.customWidth && canvasSettings.customHeight) {
        yaml += `  customWidth: ${canvasSettings.customWidth}\n`;
        yaml += `  customHeight: ${canvasSettings.customHeight}\n`;
    }

    // キャンバス全体のプロンプト要素を出力
    if (canvasSettings.promptElements && canvasSettings.promptElements.length > 0) {
        yaml += "  promptElements:\n";
        canvasSettings.promptElements.forEach(element => {
            yaml += `    - id: ${element.id}\n`;
            yaml += `      category: "${element.category}"\n`;
            yaml += `      value: "${element.value}"\n`;
        });
    }

    yaml += "\nelements:\n";
    notes.forEach((note) => {
        yaml += `  - id: ${note.id}\n`;
        yaml += `    type: ${note.type}\n`;
        yaml += `    position: { x: ${note.x}, y: ${note.y} }\n`;
        yaml += `    size: { width: ${note.width}, height: ${note.height} }\n`;
        yaml += `    content: "${note.content}"\n`;

        // 付箋タイプに応じて適切な詳細情報を出力
        switch (note.type) {
            case "character":
                if (note.characterDetails) {
                    yaml += `    characterDetails:\n`;
                    yaml += `      gender: "${note.characterDetails.gender || ""}"\n`;
                    yaml += `      age: "${note.characterDetails.age || ""}"\n`;
                }
                break;

            case "place":
                if (note.placeDetails) {
                    yaml += `    placeDetails:\n`;
                    yaml += `      location: "${note.placeDetails.location || ""}"\n`;
                    yaml += `      atmosphere: "${note.placeDetails.atmosphere || ""}"\n`;
                }
                break;

            case "event":
                if (note.eventDetails) {
                    yaml += `    eventDetails:\n`;
                    yaml += `      time: "${note.eventDetails.time || ""}"\n`;
                    yaml += `      importance: "${note.eventDetails.importance || ""}"\n`;
                }
                break;

            case "item":
                if (note.itemDetails) {
                    yaml += `    itemDetails:\n`;
                    yaml += `      category: "${note.itemDetails.category || ""}"\n`;
                    yaml += `      importance: "${note.itemDetails.importance || ""}"\n`;
                }
                break;

            case "emotion":
                if (note.emotionDetails) {
                    yaml += `    emotionDetails:\n`;
                    yaml += `      intensity: "${note.emotionDetails.intensity || ""}"\n`;
                    yaml += `      trigger: "${note.emotionDetails.trigger || ""}"\n`;
                }
                break;
        }
    });
    return yaml;
};
