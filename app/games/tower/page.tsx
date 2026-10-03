"use client"
import { useEffect, useRef } from "react";
import Link from "next/link";

export default function BorjPostatee() {
  const gameRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      // @ts-ignore
      if (!window.Phaser) {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js";
        await new Promise(res => { s.onload = res; document.head.appendChild(s); });
      }
      // @ts-ignore
      const Phaser = window.Phaser;

      class Game extends Phaser.Scene {
        score!: number; gameOver!: boolean; dir!: number; speed!: number;
        colors!: number[]; stack!: any[]; topY!: number; base!: any;
        moving!: any; scoreText!: any; msg!: any; start!: any[];
        create() {
          this.score = 0; this.gameOver = false; this.dir = 1; this.speed = 3;
          this.colors = [0x2196F3, 0x00BCD4, 0x4CAF50, 0xFFC107, 0xFF5722];
          this.cameras.main.setBackgroundColor('#87CEEB');

          for (let i = 0; i < 10; i++) {
            let c = this.add.container(Phaser.Math.Between(0, 360), Phaser.Math.Between(-2000, 600));
            c.add(this.add.circle(0, 0, 20, 0xffffff, 0.9));
            c.add(this.add.circle(22, 6, 26, 0xffffff, 0.9));
            c.add(this.add.circle(-20, 8, 18, 0xffffff, 0.9));
          }
          this.add.rectangle(50, 400, 80, 1200, 0x636e72).setStrokeStyle(2, 0x2d3436);
          this.add.rectangle(310, 300, 90, 1400, 0x57606f).setStrokeStyle(2, 0x2d3436);
          for (let i = 0; i < 25; i++) {
            this.add.rectangle(35 + Phaser.Math.Between(0, 30), 700 - i * 45, 10, 14, Math.random() > 0.5? 0xffeaa7 : 0x2d3436);
            this.add.rectangle(295 + Phaser.Math.Between(0, 30), 700 - i * 45, 10, 14, Math.random() > 0.5? 0x81ecec : 0x2d3436);
          }

          this.base = this.add.rectangle(180, 650, 130, 26, 0x2d3436);
          this.stack = [this.base];
          this.topY = 650;

          this.spawnBlock();

          this.scoreText = this.add.text(180, 30, '0', { fontSize: '60px', color: '#fff', fontFamily: 'Arial Black' }).setOrigin(0.5).setStroke('#000', 6).setScrollFactor(0);
          this.msg = this.add.text(180, 90, '', { fontSize: '14px', color: '#fff', backgroundColor: '#0006', padding: { x: 8, y: 3 } }).setOrigin(0.5).setScrollFactor(0);

          let bg = this.add.rectangle(180, 350, 300, 140, 0x000, 0.85).setScrollFactor(0);
          let t1 = this.add.text(180, 315, '🏗️ برج بوستاتي', { fontSize: '24px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0);
          let t2 = this.add.text(180, 345, 'شايف البرج تحت؟\nكل طوبة حتبنيها حتشوف البرج\nكلو طالع لفوق قدامك', { fontSize: '13px', color: '#dfe6e9', align: 'center' }).setOrigin(0.5).setScrollFactor(0);
          let t3 = this.add.text(180, 385, 'ابدأ 👇', { fontSize: '14px', color: '#000', backgroundColor: '#ffeaa7', padding: { x: 20, y: 5 } }).setOrigin(0.5).setScrollFactor(0);
          this.start = [bg, t1, t2, t3];

          this.input.on('pointerdown', () => this.drop());
        }

        spawnBlock() {
          let last = this.stack[this.stack.length - 1];
          this.topY = last.y - 32;
          let col = this.colors[this.score % this.colors.length];
          this.moving = this.add.rectangle(30, this.topY, last.width, 26, col).setStrokeStyle(2, 0xfff);
        }

        drop() {
          if (this.start.length > 0) { this.start.forEach((o: any) => o.destroy()); this.start = []; return; }
          if (this.gameOver) { this.scene.restart(); return; }
          if (!this.moving) return;

          let last = this.stack[this.stack.length - 1];
          let diff = Math.abs(this.moving.x - last.x);
          let overlap = last.width - diff;

          if (overlap <= 5) {
            this.tweens.add({ targets: this.moving, y: this.moving.y + 600, alpha: 0, duration: 500 });
            this.end(); return;
          }

          if (diff < 4) { this.moving.x = last.x; this.msg.setText('مثالي ✨'); this.cameras.main.shake(50, 0.004); }
          else {
            this.moving.width = overlap;
            this.moving.x = this.moving.x > last.x? last.x + (last.width - overlap) / 2 : last.x - (last.width - overlap) / 2;
          }

          this.stack.push(this.moving);
          this.score++; this.scoreText.setText(this.score);

          let targetY = this.moving.y - 500;
          this.tweens.add({ targets: this.cameras.main, scrollY: targetY, duration: 400, ease: 'Power2' });

          this.moving = null;
          this.time.delayedCall(150, () => this.spawnBlock());
        }

        update() {
          if (this.moving && this.start.length == 0 &&!this.gameOver) {
            this.moving.x += this.speed * this.dir;
            if (this.moving.x > 320 - this.moving.width / 2) { this.moving.x = 320 - this.moving.width / 2; this.dir = -1; }
            if (this.moving.x < 40 + this.moving.width / 2) { this.moving.x = 40 + this.moving.width / 2; this.dir = 1; }
          }
        }

        end() {
          this.gameOver = true;
          this.time.delayedCall(400, () => {
            this.add.rectangle(180, this.cameras.main.scrollY + 350, 280, 120, 0x000, 0.9).setScrollFactor(0);
            this.add.text(180, this.cameras.main.scrollY + 330, 'وقع! 💥', { fontSize: '22px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0);
            this.add.text(180, this.cameras.main.scrollY + 355, `${this.score} طابق - اضغط للاعادة`, { fontSize: '16px', color: '#ffeaa7' }).setOrigin(0.5).setScrollFactor(0);
          });
        }
      }

      if (gameRef.current) gameRef.current.destroy(true);
      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        width: 360, height: 700,
        backgroundColor: '#87CEEB',
        parent: "game-container",
        scene: Game,
      });
    };
    load();
    return () => { if (gameRef.current) gameRef.current.destroy(true); };
  }, []);

  return (
    <div className="h-[100dvh] bg-[#87CEEB] flex flex-col max-w-[480px] mx-auto" dir="rtl">
      <div className="flex-shrink-0 p-3 bg-[#122025] text-white flex justify-between items-center border-b border-black/20">
        <Link href="/games" className="text-sm bg-white/10 px-3 py-1 rounded-full">← الألعاب</Link>
        <p className="font-black text-sm">🏗️ برج بوستاتي</p>
        <div className="w-[60px]"></div>
      </div>
      <div id="game-container" className="flex-1 flex justify-center items-center overflow-hidden" />
    </div>
  );
}