export class FileMessage {
  static deserialize(data: DataView) {
    let offset = 0;
    const id = data.getUint32(offset);
    offset += 4;
    const fileNameByteCount = data.getUint32(offset);
    offset += 4;
    const charCount = fileNameByteCount / 2;
    let fileName = "";
    for (let i = 0; i < charCount; i++) {
      const charCode = data.getUint16(offset);
      fileName += String.fromCharCode(charCode);
      offset += 2;
    }
    const remainingLength = data.byteLength - offset;
    const bytes = new Uint8Array(data.buffer, offset, remainingLength);
    return { file: new File([bytes], fileName), id: id };
  }

  static async serialize(file: File, id: number): Promise<DataView> {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const fileNameByteCount = file.name.length * 2;
    const fileByteCount = fileBytes.byteLength;
    const buffer = new ArrayBuffer(4 + 4 + fileNameByteCount + fileByteCount);
    const dataView = new DataView(buffer);
    let offset = 0;
    dataView.setUint32(offset, id);
    offset += 4;
    dataView.setUint32(offset, fileNameByteCount);
    offset += 4;
    for (let i = 0; i < file.name.length; i++) {
      const char = file.name.charCodeAt(i);
      dataView.setUint16(offset, char);
      offset += 2;
    }
    for (const byte of fileBytes) {
      dataView.setUint8(offset, byte);
      offset++;
    }
    return dataView;
  }
}
