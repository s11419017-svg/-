// Dynamic Encounter and Ambush Engine for Valjean's Escape

import { DynamicEventState, DynamicEventType } from './types';

export class EncounterEngine {
  /**
   * Evaluates whether a new dynamic encounter should trigger based on distance and game conditions
   */
  public static evaluateEncounterTrigger(
    distance: number,
    currentEvent: DynamicEventState,
    inSewer: boolean,
    heatLevel: number
  ): DynamicEventType {
    if (currentEvent.active) return 'none';

    // Pincer ambush trigger condition: In street/barricade, high distance or elevated heat
    if (!inSewer && distance > 300 && (distance % 520 < 45 || heatLevel >= 4)) {
      return 'pincer_ambush';
    }

    // Sewer Sluice lockdown trigger condition: Underground sewer with high tension
    if (inSewer && distance > 250 && distance % 650 < 45) {
      return 'sluice_lockdown';
    }

    // Barricade crisis / mortar siege
    if (!inSewer && distance > 800 && distance % 900 < 50) {
      return 'barricade_crisis';
    }

    return 'none';
  }

  /**
   * Initializes a new dynamic encounter state
   */
  public static createEncounter(
    type: DynamicEventType,
    playerX: number,
    _groundY: number
  ): DynamicEventState {
    switch (type) {
      case 'pincer_ambush':
        return {
          active: true,
          type: 'pincer_ambush',
          timer: 360, // ~6 seconds of intense encounter
          maxDuration: 360,
          bannerTitle: '⚠️ 兩翼包夾！警笛大作！',
          bannerSub: '前後憲兵合圍！利用雨遮鷹架飛躍或引爆火藥破局！',
          leftFlankActive: true,
          rightFlankActive: true,
        };

      case 'sluice_lockdown':
        return {
          active: true,
          type: 'sluice_lockdown',
          timer: 480, // ~8 seconds
          maxDuration: 480,
          bannerTitle: '🚨 下水道水閘封鎖！急流激增！',
          bannerSub: '鐵閘門封死！踩踏崩塌石磚躍起，或拉開頂部緊急洩洪閥門！',
          valvePulled: false,
          gateLeftX: playerX - 320,
          gateRightX: playerX + 420,
          floodLevel: 0,
        };

      case 'barricade_crisis':
        return {
          active: true,
          type: 'barricade_crisis',
          timer: 420,
          maxDuration: 420,
          bannerTitle: '🔥 街壘砲擊危機！迫擊砲齊射！',
          bannerSub: '注意地面紅圈預警，利用木箱掩體快速穿梭！',
        };

      default:
        return {
          active: false,
          type: 'none',
          timer: 0,
          maxDuration: 0,
          bannerTitle: '',
          bannerSub: '',
        };
    }
  }

  /**
   * Renders high-impact cinematic warning overlays on the canvas
   */
  public static renderEncounterHUD(
    ctx: CanvasRenderingContext2D,
    event: DynamicEventState,
    canvasW: number,
    _canvasH: number
  ) {
    if (!event.active) return;

    ctx.save();

    // 1. Dynamic Flank Warning Arrows for Pincer Ambush
    if (event.type === 'pincer_ambush') {
      const pulse = Math.sin(Date.now() / 120) * 0.5 + 0.5;
      const arrowAlpha = 0.4 + pulse * 0.5;

      // Left Flank Danger Indicator
      ctx.fillStyle = `rgba(239, 68, 68, ${arrowAlpha * 0.3})`;
      ctx.fillRect(0, 0, 36, _canvasH);
      ctx.fillStyle = `rgba(255, 255, 255, ${arrowAlpha})`;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▶▶', 20, _canvasH / 2);

      // Right Flank Danger Indicator
      ctx.fillStyle = `rgba(239, 68, 68, ${arrowAlpha * 0.3})`;
      ctx.fillRect(canvasW - 36, 0, 36, _canvasH);
      ctx.fillStyle = `rgba(255, 255, 255, ${arrowAlpha})`;
      ctx.fillText('◀◀', canvasW - 20, _canvasH / 2);
    }

    // 2. Sluice Lockdown Water Warning
    if (event.type === 'sluice_lockdown') {
      const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(6, 182, 212, ${0.12 + pulse * 0.08})`;
      ctx.fillRect(0, 0, canvasW, _canvasH);
    }

    ctx.restore();
  }
}
