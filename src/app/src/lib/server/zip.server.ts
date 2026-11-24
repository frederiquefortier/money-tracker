import { crc32, deflateRawSync } from 'node:zlib'

// A zip of a few text files, from Node's zlib (ADR-067). No zip64: an export is far
// below 4 GB. Names are flagged UTF-8 (bit 11).
const UTF8_NAMES = 0x0800
const DEFLATE = 8
const VERSION = 20

export type ZipEntry = { name: string; text: string }

function dosTime(at: Date) {
  return {
    time:
      (at.getHours() << 11) | (at.getMinutes() << 5) | (at.getSeconds() >> 1),
    date:
      ((at.getFullYear() - 1980) << 9) |
      ((at.getMonth() + 1) << 5) |
      at.getDate(),
  }
}

/** The files deflated into one zip archive. */
export function zipFiles(
  entries: ReadonlyArray<ZipEntry>,
  at = new Date(),
): Buffer {
  const { time, date } = dosTime(at)
  const locals: Array<Buffer> = []
  const centrals: Array<Buffer> = []
  let offset = 0
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const data = Buffer.from(entry.text, 'utf8')
    const packed = deflateRawSync(data)
    const crc = crc32(data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(VERSION, 4)
    local.writeUInt16LE(UTF8_NAMES, 6)
    local.writeUInt16LE(DEFLATE, 8)
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(packed.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    locals.push(local, name, packed)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(VERSION, 4)
    central.writeUInt16LE(VERSION, 6)
    central.writeUInt16LE(UTF8_NAMES, 8)
    central.writeUInt16LE(DEFLATE, 10)
    central.writeUInt16LE(time, 12)
    central.writeUInt16LE(date, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(packed.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, name)

    offset += local.length + name.length + packed.length
  }
  const directory = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end])
}
