import { useEffect } from 'react';
import { haptics } from '../../../../app/haptics';
import { PaperSheet } from '../../../../components/comic/PaperSheet';
import type { PlayerViewProps } from '../../../game-types';
import { useRemoteCanvas } from '../../hooks/useRemoteCanvas';
import type { MontagsmalerPrivateState, MontagsmalerPublicState } from '../../types';
import { DrawerView } from './DrawerView';
import { GuesserView } from './GuesserView';
import { PlayerHeader } from './PlayerHeader';
import { RevealView } from './RevealView';
import { WordChooser } from './WordChooser';

export function MontagsmalerPlayerView({ room, me, state, sendAction }: PlayerViewProps<MontagsmalerPublicState, MontagsmalerPrivateState>) {
  const pub = state.public;
  const priv = state.private;
  const model = useRemoteCanvas(pub.turn);
  const drawer = room.players.find((p) => p.id === pub.drawerId);
  const myScore = pub.scores.find((s) => s.playerId === me.id)?.score ?? 0;
  const isDrawer = priv?.role === 'drawer';

  // kurzes Vibrieren, wenn man an der Reihe ist
  useEffect(() => {
    if (isDrawer && pub.phase !== 'reveal') haptics.play('double');
  }, [isDrawer, pub.turn]); // eslint-disable-line react-hooks/exhaustive-deps

  let content;
  if (pub.phase === 'reveal') content = <RevealView state={pub} meId={me.id} />;
  else if (priv?.role === 'drawer' && pub.phase === 'choosing') {
    content = (
      <>
        <PlayerHeader state={pub} />
        <WordChooser choices={priv.choices ?? []} onChoose={(index) => sendAction('chooseWord', { index })} />
      </>
    );
  } else if (priv?.role === 'drawer') content = <DrawerView state={pub} word={priv.word ?? ''} model={model} sendAction={sendAction} />;
  else if (priv?.role === 'guesser') content = <GuesserView state={pub} priv={priv} drawer={drawer} myScore={myScore} model={model} sendAction={sendAction} />;
  else content = null;

  return <PaperSheet compact>{content}</PaperSheet>;
}
