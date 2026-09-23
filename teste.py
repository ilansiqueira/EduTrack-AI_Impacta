def verificar_sinal(numero):
    if numero > 0:
        return "positivo"
    elif numero < 0:
        return "negativo"
    else:
        return "zero (neutro)"

if __name__ == "__main__":
    try:
        valor = float(input("Digite um número: "))
        print(f"O número {valor} é {verificar_sinal(valor)}.")
    except ValueError:
        print("Erro: Por favor, informe um número válido.")
