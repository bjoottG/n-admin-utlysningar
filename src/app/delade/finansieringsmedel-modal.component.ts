import { Component, HostListener, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FinansieringsmedelPost,
  UtlysningService,
  finansieringsmedelEtikett,
} from '../utlysning.service';

/**
 * Modal för att välja finansieringsmedel till en utlysning:
 * sökbar tabell (Anslag/Uppdrag/Deluppdrag/Kontotyp) med kryssrutor
 * och paginering om max 10 rader per sida.
 */
@Component({
  selector: 'app-finansieringsmedel-modal',
  imports: [FormsModule],
  templateUrl: './finansieringsmedel-modal.component.html',
})
export class FinansieringsmedelModalComponent implements OnInit {
  private readonly service = inject(UtlysningService);

  /** Etiketter som redan är valda när modalen öppnas. */
  readonly valda = input<string[]>([]);
  readonly kravMinstEtt = input(false);
  readonly stang = output<void>();
  readonly bekrafta = output<string[]>();

  readonly poster = this.service.hamtaFinansieringsmedelPoster();
  readonly sidstorlek = 10;

  readonly sok = signal('');
  readonly sida = signal(1);
  readonly lokaltValda = signal<string[]>([]);

  ngOnInit(): void {
    this.lokaltValda.set([...this.valda()]);
  }

  readonly filtrerade = computed(() => {
    const sok = this.sok().trim().toLowerCase();
    if (!sok) return this.poster;
    return this.poster.filter((post) =>
      [post.anslag, post.uppdrag, post.deluppdrag, post.kontotyp].some((falt) =>
        falt.toLowerCase().includes(sok),
      ),
    );
  });

  readonly antalSidor = computed(() =>
    Math.max(1, Math.ceil(this.filtrerade().length / this.sidstorlek)),
  );

  readonly sidnummer = computed(() =>
    Array.from({ length: this.antalSidor() }, (_, i) => i + 1),
  );

  readonly sidansPoster = computed(() => {
    const start = (this.sida() - 1) * this.sidstorlek;
    return this.filtrerade().slice(start, start + this.sidstorlek);
  });

  readonly visarFran = computed(() =>
    this.filtrerade().length === 0 ? 0 : (this.sida() - 1) * this.sidstorlek + 1,
  );

  readonly visarTill = computed(() =>
    Math.min(this.sida() * this.sidstorlek, this.filtrerade().length),
  );

  readonly kanSpara = computed(() => !this.kravMinstEtt() || this.lokaltValda().length > 0);

  @HostListener('document:keydown.escape')
  stangMedEscape(): void {
    this.stang.emit();
  }

  etikett(post: FinansieringsmedelPost): string {
    return finansieringsmedelEtikett(post);
  }

  arVald(post: FinansieringsmedelPost): boolean {
    return this.lokaltValda().includes(this.etikett(post));
  }

  toggle(post: FinansieringsmedelPost): void {
    const etikett = this.etikett(post);
    this.lokaltValda.update((valda) =>
      valda.includes(etikett) ? valda.filter((v) => v !== etikett) : [...valda, etikett],
    );
  }

  sattSok(varde: string): void {
    this.sok.set(varde);
    this.sida.set(1);
  }

  gaTillSida(sida: number): void {
    this.sida.set(Math.min(Math.max(1, sida), this.antalSidor()));
  }

  sparaVal(): void {
    if (!this.kanSpara()) return;
    this.bekrafta.emit(this.lokaltValda());
  }
}
