<script>
  export let values;
  export let enhancementLevel

  $: getRating = () => {
    const lvl = Number(enhancementLevel) + 1
    const sum = values.reduce((acc, [val, max]) => acc + (val * 100 / max), 0)
    const result = sum - (lvl * 100)
    if (result < 50.1) return "F";
    if (result < 100.5) return "E";
    if (result < 150.51) return "D";
    if (result < 200.51) return "C";
    if (result < 235.51) return "B";
    if (result < 260.1) return "A";
    if (result < 275.1) return "S";
    if (result < 287.51) return "SS";

    return "SSS";
  };
</script>

<div class="card">
  <div class="card-body">
    Stats rolls luck: <span class="font-weight-bold text-monospace">{getRating()}</span>
  </div>
</div>