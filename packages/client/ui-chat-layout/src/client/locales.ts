/** `chat-layout` namespace dictionaries (the width and timestamp settings rows). */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'width.title': '会话宽度',
  'width.description': '手动：拖动会话两侧调整。固定：使用下方像素宽度。铺满：占满窗口可用宽度',
  'width.manual': '手动（拖动）',
  'width.fixed': '固定',
  'width.fill': '铺满',
  'width.px': '宽度（像素）',
  'timestamps.title': '消息时间戳',
  'timestamps.description': '在每条消息左侧显示发送时间',
  'timestamps.off': '关闭',
  'timestamps.24h': '24 小时制',
  'timestamps.12h': '12 小时制',
} satisfies Record<string, string>

/** The chat-layout namespace key union. */
export type ChatLayoutKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'width.title': 'Chat width',
  'width.description': 'Manual: drag the conversation edges. Fixed: the px width below. Fill: as wide as the window allows',
  'width.manual': 'Manual (drag)',
  'width.fixed': 'Fixed',
  'width.fill': 'Fill',
  'width.px': 'Width (px)',
  'timestamps.title': 'Message timestamps',
  'timestamps.description': 'Show when each message was sent, to its left',
  'timestamps.off': 'Off',
  'timestamps.24h': '24-hour',
  'timestamps.12h': '12-hour',
} satisfies Record<ChatLayoutKey, string>
