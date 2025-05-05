export class FileMessage {
  static deserialize(data: DataView) {
    let offset = 0;
    // read id
    const id = data.getUint32(offset);
    offset += 4;
    // read file name char count
    const fileNameCharCount = data.getUint32(offset) / 2;
    offset += 4;
    // read file name
    let fileName = "";
    for (let i = 0; i < fileNameCharCount; i++) {
      const charCode = data.getUint16(offset);
      fileName += String.fromCharCode(charCode);
      offset += 2;
    }
    // read file type char count
    const fileTypeCharCount = data.getUint32(offset) / 2;
    offset += 4;
    let fileType = "";
    for (let i = 0; i < fileTypeCharCount; i++) {
      const charCode = data.getUint16(offset);
      fileType += String.fromCharCode(charCode);
      offset += 2;
    }

    // read file content
    const remainingLength = data.byteLength - offset;
    const bytes = new Uint8Array(data.buffer, offset, remainingLength);
    return { file: new File([bytes], fileName, { type: fileType }), id: id };
  }

  static async serialize(file: File, id: number): Promise<DataView> {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const fileNameByteCount = file.name.length * 2;
    const fileTypeByteCount = file.type.length * 2;
    const fileByteCount = fileBytes.byteLength;
    const buffer = new ArrayBuffer(
      4 + 4 + fileNameByteCount + 4 + fileTypeByteCount + fileByteCount,
    );
    const dataView = new DataView(buffer);
    let offset = 0;
    // set message id
    dataView.setUint32(offset, id);
    offset += 4;
    // set file name byte count
    dataView.setUint32(offset, fileNameByteCount);
    offset += 4;
    // set file name
    for (let i = 0; i < file.name.length; i++) {
      const char = file.name.charCodeAt(i);
      dataView.setUint16(offset, char);
      offset += 2;
    }
    // set file type byte count
    dataView.setUint32(offset, fileTypeByteCount);
    offset += 4;
    // set file type
    for (let i = 0; i < file.type.length; i++) {
      const char = file.type.charCodeAt(i);
      dataView.setUint16(offset, char);
      offset += 2;
    }
    // set file content
    for (const byte of fileBytes) {
      dataView.setUint8(offset, byte);
      offset++;
    }
    return dataView;
  }
}
