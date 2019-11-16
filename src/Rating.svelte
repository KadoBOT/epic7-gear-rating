<script>
  export let values;
  export let enhancementLevel

  $: getRating = () => {
    const lvl = Number(enhancementLevel) + 1
    const sum = values.reduce((acc, [val, max]) => acc + (val * 100 / max), 0)
    const result = sum - (lvl * 10)
    console.log(result)
    if (result <= 445) return "F";
    if (result <= 470) return "E";
    if (result <= 500) return "D";
    if (result <= 535) return "C";
    if (result <= 575) return "B";
    if (result <= 640) return "A";
    if (result <= 778) return "S";
    if (result <= 815) return "SS";

    return "SSS";
  };
</script>

<div class="card">
  <div class="card-body">
    Stats rolls luck: <span class="font-weight-bold text-monospace">{getRating()}</span>
  </div>
</div>