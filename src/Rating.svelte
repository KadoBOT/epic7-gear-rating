<script>
  export let values;
  export let enhancementLevel

  $: getRating = () => {
    const lvl = Number(enhancementLevel) + 1
    const result = values.reduce((acc, [val, max]) => acc + (val * 100 / ((max * lvl) + (max * (values.length - 1)))), 0)
    console.log(result)
    if (result <= 54) return "F";
    if (result <= 65) return "E";
    if (result <= 73) return "D";
    if (result <= 80) return "C";
    if (result <= 86) return "B";
    if (result <= 91) return "A";
    if (result <= 95) return "S";
    if (result <= 98) return "SS";

    return "SSS";
  };
</script>

<div class="card">
  <div class="card-body">
    Stats rolls luck: <span class="font-weight-bold text-monospace">{getRating()}</span>
  </div>
</div>