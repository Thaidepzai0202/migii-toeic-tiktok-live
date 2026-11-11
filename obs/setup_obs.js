// Ghi profile + scene collection "MigiiToeicLive" cho OBS (khung dọc 1080×1920, 1 nguồn trình duyệt có tiếng).
// Chạy khi OBS đang TẮT (OBS đang mở sẽ ghi đè lúc thoát):  node obs/setup_obs.js
// Stream key không ghi ở đây — go_live.sh đọc từ .env và ghi service.json ngay trước khi phát.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const NAME = 'MigiiToeicLive';
const PORT = process.env.QUIZ_PORT || 8788;
// OBS_VCAM=1: OBS chỉ làm CAMERA ẢO nét 1080×1920 cho TikTok LIVE Studio (màn hình Mac 1080p chụp cửa sổ bị mờ).
// Trang trong OBS tắt tiếng (?mute=1) — tiếng vẫn do cửa sổ game Chrome phát, LIVE Studio thu như cũ.
const VCAM = process.env.OBS_VCAM === '1';
const ROOT = path.join(os.homedir(), 'Library/Application Support/obs-studio');
const profileDir = path.join(ROOT, 'basic/profiles', NAME);
fs.mkdirSync(profileDir, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'basic/scenes'), { recursive: true });

// --- profile ---
fs.writeFileSync(path.join(profileDir, 'basic.ini'), `[General]
Name=${NAME}

[Video]
BaseCX=1080
BaseCY=1920
OutputCX=1080
OutputCY=1920
FPSType=0
FPSCommon=30
ScaleType=bicubic
ColorFormat=NV12
ColorSpace=709
ColorRange=Partial

[Audio]
SampleRate=48000
ChannelSetup=Stereo

[Output]
Mode=Simple
Reconnect=true
RetryDelay=2
MaxRetries=25

[SimpleOutput]
StreamEncoder=apple_h264
VBitrate=4500
ABitrate=160
UseAdvanced=false
StreamAudioEncoder=aac
`);

// --- scene collection ---
const browserUuid = crypto.randomUUID();
const sceneUuid = crypto.randomUUID();
const collection = {
  name: NAME,
  current_scene: 'Game',
  current_program_scene: 'Game',
  scene_order: [{ name: 'Game' }],
  sources: [
    {
      id: 'browser_source',
      versioned_id: 'browser_source',
      name: 'Trang game',
      uuid: browserUuid,
      enabled: true,
      flags: 0,
      mixers: 255,
      volume: 1.0,
      muted: false,
      sync: 0,
      monitoring_type: 0,
      settings: {
        url: `http://localhost:${PORT}/${VCAM ? '?mute=1' : ''}`,
        width: 1080,
        height: 1920,
        fps: 30,
        fps_custom: true,
        reroute_audio: true, // "Control audio via OBS": tiếng trang game đi vào luồng phát (bản vcam: trang im lặng sẵn)
        restart_when_active: false,
        shutdown: false,
      },
    },
    {
      id: 'scene',
      versioned_id: 'scene',
      name: 'Game',
      uuid: sceneUuid,
      enabled: true,
      flags: 0,
      mixers: 0,
      volume: 1.0,
      settings: {
        custom_size: false,
        id_counter: 1,
        items: [
          {
            name: 'Trang game',
            source_uuid: browserUuid,
            id: 1,
            visible: true,
            locked: true,
            pos: { x: 0, y: 0 },
            scale: { x: 1, y: 1 },
            rot: 0,
            align: 5,
            bounds_type: 0,
            bounds: { x: 0, y: 0 },
            crop_left: 0, crop_top: 0, crop_right: 0, crop_bottom: 0,
          },
        ],
      },
    },
  ],
  groups: [],
  transitions: [],
  current_transition: 'Fade',
  transition_duration: 300,
  quick_transitions: [],
  saved_projectors: [],
  modules: {},
};
fs.writeFileSync(path.join(ROOT, 'basic/scenes', `${NAME}.json`), JSON.stringify(collection, null, 2));

// --- user.ini: chọn profile/collection mới, tắt trình hướng dẫn lần đầu + hỏi khi thoát ---
const userIni = path.join(ROOT, 'user.ini');
let ini = fs.existsSync(userIni) ? fs.readFileSync(userIni, 'utf8') : '[General]\n';
const set = (section, key, val) => {
  const re = new RegExp(`(\\[${section}\\][^\\[]*?)^${key}=.*$`, 'm');
  if (re.test(ini)) ini = ini.replace(re, `$1${key}=${val}`);
  else if (ini.includes(`[${section}]`)) ini = ini.replace(`[${section}]`, `[${section}]\n${key}=${val}`);
  else ini += `\n[${section}]\n${key}=${val}\n`;
};
set('General', 'FirstRun', 'false');
set('General', 'ConfirmOnExit', 'false');
set('Basic', 'Profile', NAME);
set('Basic', 'ProfileDir', NAME);
set('Basic', 'SceneCollection', NAME);
set('Basic', 'SceneCollectionFile', `${NAME}.json`);
set('BasicWindow', 'WarnBeforeStartingStream', 'false');
set('BasicWindow', 'WarnBeforeStoppingStream', 'false');
fs.writeFileSync(userIni, ini);

console.log(`OBS: profile + scene "${NAME}" → ${ROOT}`);
