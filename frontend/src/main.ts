/* Bundle entry point.
 *
 * ui/app.js (the loader) injects this file as a plain classic script AFTER the
 * Supero runtime has published its globals, so `client` and `services` already
 * exist by the time this runs. It mounts into #reclaim-root, a sibling of the
 * library's own #root, which the loader hides.
 */
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

function container(): HTMLElement {
  let el = document.getElementById('reclaim-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'reclaim-root';
    document.body.appendChild(el);
  }
  return el;
}

mount(App, { target: container() });
