import { Injectable } from '@angular/core';

export interface Utlysning {
  utlysningNamn: string;
  diarienummer: string;
  diarieSystem: string;
  interntNamn: string;
  startstoedformsnod: string;
  sprak: string;
  periodFran: string;
  periodTill: string;
  ingress: string;
  beskrivning: string;
  finansieringsmedel: string[];
  stoedformPath: string;
}

@Injectable({ providedIn: 'root' })
export class UtlysningService {
  utlysning: Utlysning | null = null;
  justSaved = false;
}
