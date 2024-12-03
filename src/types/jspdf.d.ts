import { jsPDF } from 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: string[][];
      body?: string[][];
      styles?: {
        fontSize?: number;
        [key: string]: any;
      };
      headStyles?: {
        fillColor?: number[];
        [key: string]: any;
      };
      [key: string]: any;
    }) => void;
  }
}
