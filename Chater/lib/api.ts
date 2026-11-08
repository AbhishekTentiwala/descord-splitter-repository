const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export const apiUrl = (path: string) => `${API_URL}${path}`;
export const socketUrl = (path: string) => `${SOCKET_URL}${path}`;