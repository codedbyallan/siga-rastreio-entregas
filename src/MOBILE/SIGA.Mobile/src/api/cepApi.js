function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export async function getAddressByCepApi(cep) {
  const cleanCep = onlyDigits(cep);

  if (cleanCep.length !== 8) {
    throw new Error("Informe um CEP com 8 dígitos.");
  }

  let response;

  try {
    response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  } catch {
    throw new Error("Não foi possível consultar o CEP. Verifique sua conexão.");
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Resposta inválida ao consultar o CEP.");
  }

  if (!response.ok || data?.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    street: data?.logradouro || "",
    neighborhood: data?.bairro || "",
    city: data?.localidade || "",
    state: data?.uf || "",
    postalCode: cleanCep,
  };
}