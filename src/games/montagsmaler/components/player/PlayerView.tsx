import type { PlayerViewProps } from '../../../game-types';
import { useRemoteCanvas } from '../../hooks/useRemoteCanvas';
import type { MontagsmalerPrivateState, MontagsmalerPublicState } from '../../types';
import { DrawerView } from './DrawerView';
import { GuesserView } from './GuesserView';
import { RevealView } from './RevealView';
import { WordChooser } from './WordChooser';
import { PlayerHeader } from './PlayerHeader';

export function MontagsmalerPlayerView({ room, me, state, sendAction }: PlayerViewProps<MontagsmalerPublicState, MontagsmalerPrivateState>) {
  const pub = state.public;
  const priv = state.private;
  const model = useRemoteCanvas(pub.turn);
  const drawer = room.players.find((p) => p.id === pub.drawerId);
  const myScore = pub.scores.find((s) => s.playerId === me.id)?.score ?? 0;

  if (pub.phase === 'reveal') return <RevealView state={pub} meId={me.id} />;

  if (priv?.role === 'drawer') {
    if (pub.phase === 'choosing') {
      return (
        <div className="flex h-dvh flex-col">
          <PlayerHeader state={pub} />
          <WordChooser choices={priv.choices ?? []} onChoose={(index) => sendAction('chooseWord', { index })} />
        </div>
      );
    }
    return <DrawerView state={pub} word={priv.word ?? ''} model={model} sendAction={sendAction} />;
  }

  if (priv?.role === 'guesser') {
    return <GuesserView state={pub} priv={priv} drawer={drawer} myScore={myScore} model={model} sendAction={sendAction} />;
  }
  return null;
}
