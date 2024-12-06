"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentDayAndPeriod = void 0;
function getCurrentDayAndPeriod() {
    const now = new Date();
    const day = now.getDay(); // 日曜日は0, 土曜日は6
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; //- 30; // 時刻を分単位に変換
    let period = null;
    // 授業時間帯を判定
    if (currentTime >= 530 && currentTime < 620)
        period = 1; // 8:50 ~ 10:20
    else if (currentTime >= 630 && currentTime < 720)
        period = 2; // 10:30 ~ 12:00
    else if (currentTime >= 770 && currentTime < 860)
        period = 3; // 12:50 ~ 14:20
    else if (currentTime >= 870 && currentTime < 960)
        period = 4; // 14:30 ~ 16:00
    // 休憩時間の判定
    else if (currentTime >= 620 && currentTime < 630)
        period = "休憩時間 (10:20 ~ 10:30)";
    else if (currentTime >= 720 && currentTime < 770)
        period = "昼休み (12:00 ~ 12:50)";
    else if (currentTime >= 860 && currentTime < 870)
        period = "休憩時間 (14:20 ~ 14:30)";
    // 放課後の判定
    else if (currentTime >= 960)
        period = "放課後";
    // 授業外の判定
    else
        period = null; // 授業時間外
    console.log(`day: ${day}, period: ${period}`);
    return { day, period };
}
exports.getCurrentDayAndPeriod = getCurrentDayAndPeriod;
