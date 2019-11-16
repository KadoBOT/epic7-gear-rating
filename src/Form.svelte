<script>
  import Substat from "./Substat.svelte";
  import Rating from "./Rating.svelte"

  let is88 = false;
  let substats = {
    0: { min: "", max: "", name: "Other substat or none" },
    1: { min: 4, min88: 5, max: 8, max88: 9, name: "HP/Def/Eff/EffRes/Atk" },
    2: { min: 3, min88: 3, max: 5, max88: 6, name: "Crit Rate" },
    3: { min: 3, min88: 4, max: 7, max88: 8, name: "Crit Dmg" },
    4: { min: 1, min88: 2, max: 4, max88: 5, name: "Speed" }
  };
  $: enhancementLevel = "-1";
  $: values = []
  function handleValue(pos) {
    return function([val, selected]) {
      values[pos] = [val, substats[selected].max]
    }
  }
</script>

<div class="form-row align-items-center">
  <div class="col-4">
    <select
      class="form-control"
      id="enhancementLevel"
      value="-1"
      bind:value={enhancementLevel}>
      <option disabled value="-1">Select enhancement level</option>
      <option value="0">None</option>
      <option value="1">3+</option>
      <option value="2">6+</option>
      <option value="3">9+</option>
      <option value="4">12+</option>
      <option value="5">15</option>
    </select>
  </div>
  <div class="col-8">
    <div class="form-check mb-2">
      <input
        type="checkbox"
        class="form-check-input"
        id="higherLevel"
        bind:checked={is88} />
      <label class="form-check-label" for="higherLevel">Level 88+ equip</label>
    </div>
  </div>
</div>
<Substat {is88} {substats} {enhancementLevel} handleValue={handleValue(0)} />
<Substat {is88} {substats} {enhancementLevel} handleValue={handleValue(1)} />
<Substat {is88} {substats} {enhancementLevel} handleValue={handleValue(2)} />
<Substat {is88} {substats} {enhancementLevel} handleValue={handleValue(3)} />
<Rating {values} {enhancementLevel} />
