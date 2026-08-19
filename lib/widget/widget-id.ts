import crypto from "crypto";

export function generateWidgetId(): string {
return `nlw_${crypto.randomBytes(16).toString("hex")}`;
}
