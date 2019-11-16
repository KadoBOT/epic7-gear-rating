<script>
  import Substat from "./Substat.svelte";
  import Rating from "./Rating.svelte";

  let getMinAndMax = lvl => {
    const itemLevel = Number(lvl)
    if (itemLevel === 4) return [[5, 9], [3, 6], [4, 8], [2, 5]];
    if (itemLevel === 3) return [[4, 8], [3, 5], [3, 7], [1, 4]];
    if (itemLevel === 2) return [[3, 7], [2, 4], [3, 6], [1, 4]];
    return [[3, 6], [2, 4], [3, 5], [1, 3]];
  };
  $: level = "";
  $: minAndMax = getMinAndMax(level)
  $: substats = {
    0: { min: "", max: "", name: "No substat" },
    1: { min: minAndMax[0][0], max: minAndMax[0][1], name: "HP/Def/Eff/EffRes/Atk" },
    2: { min: minAndMax[1][0], max: minAndMax[1][1], name: "Crit Rate" },
    3: { min: minAndMax[2][0], max: minAndMax[2][1], name: "Crit Dmg" },
    4: { min: minAndMax[3][0], max: minAndMax[3][1], name: "Speed" },
    "-1": { min: 0, max: 0, name: "Other substat" }
  };
  $: enhancementLevel = "";
  $: values = [];
  $: isDone = level && enhancementLevel;
  function handleValue(pos) {
    return function([val, selected]) {
      values[pos] = [val, substats[selected].max];
    };
  }
</script>

<div class="form-row align-items-center">
  <div class="col">
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
  <div class="col">
    <select
      class="form-control"
      id="enhancementLevel"
      value="-1"
      bind:value={level}>
      <option disabled value="-1">Select equipment level</option>
      <option value="1">T1: (Level 45 ~ 57)</option>
      <option value="2">T2: (Level 58 ~ 71)</option>
      <option value="3">T3: (Level 72 ~85)</option>
      <option value="4">T4: (Level 88 ~ )</option>
    </select>
  </div>
</div>
<Substat {isDone} {substats} {enhancementLevel} handleValue={handleValue(0)} />
<Substat {isDone} {substats} {enhancementLevel} handleValue={handleValue(1)} />
<Substat {isDone} {substats} {enhancementLevel} handleValue={handleValue(2)} />
<Substat {isDone} {substats} {enhancementLevel} handleValue={handleValue(3)} />
<Rating {values} {enhancementLevel} />
