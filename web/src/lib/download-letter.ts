/** Export Word (.doc) ouvrable dans Microsoft Word / LibreOffice pour édition */
export function downloadLetterAsWord(letter: string, baseFilename: string): void {
  const safeName =
    baseFilename
      .replace(/[^\w\s-àâäéèêëïîôùûüç]/gi, "")
      .slice(0, 40)
      .trim()
      .replace(/\s+/g, "-") || "lettre-negociation";

  const escaped = letter
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>Lettre de négociation</title></head>
<body style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; margin: 2cm;">
<div>${escaped}</div>
</body>
</html>`;

  const blob = new Blob(["\uFEFF", html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
