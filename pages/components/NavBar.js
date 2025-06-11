import Update from "pages/components/Update.js";
import React from "react";
import { useAuth } from "../../contexts/AuthContext"; // Importa o hook de autenticação

const NavBar = ({
  Rcontent,
  MContent,
  Cadastro,
  Ccontent,
  Gastos,
  Tcontent,
  AnualContent,
}) => {
  const { user, logout } = useAuth(); // Obtém o usuário e a função logout do contexto

  // Mapeamento dos componentes passados por props
  const componentMap = {
    Rcontent,
    MContent,
    Cadastro,
    Ccontent,
    Gastos,
    Tcontent,
    AnualContent,
  };

  // Definição de todas as abas possíveis com suas permissões
  const allTabDefinitions = [
    {
      label: "R1",
      componentName: "Rcontent",
      props: { r: 1 },
    },
    {
      label: "R2",
      componentName: "Rcontent",
      props: { r: 2 },
      allowedRoles: ["admin"],
    },
    {
      label: "R3",
      componentName: "Rcontent",
      props: { r: 3 },
      allowedRoles: ["admin"],
    },
    {
      label: "M1",
      componentName: "MContent",
      props: { oficina: "m1", r: 1 },
      checked: true,
      allowedRoles: ["admin"],
    },
    {
      label: "M2",
      componentName: "MContent",
      props: { oficina: "m2", r: 2 },
      allowedRoles: ["admin"],
    },
    {
      label: "M3",
      componentName: "MContent",
      props: { oficina: "m3", r: 3 },
      allowedRoles: ["admin"],
    },
    {
      label: "C1",
      componentName: "Ccontent",
      props: { r: 1 },
      allowedRoles: ["admin"],
    },
    {
      label: "C2",
      componentName: "Ccontent",
      props: { r: 2 },
      allowedRoles: ["admin"],
    },
    {
      label: "C3",
      componentName: "Ccontent",
      props: { r: 3 },
      allowedRoles: ["admin"],
    },
    {
      label: "T1",
      componentName: "Tcontent",
      props: { r: 1, oficina: "R1" },
      allowedRoles: ["admin"],
    },
    {
      label: "T2",
      componentName: "Tcontent",
      props: { r: 2, oficina: "R2" },
      allowedRoles: ["admin"],
    },
    {
      label: "T3",
      componentName: "Tcontent",
      props: { r: 3, oficina: "R3" },
      allowedRoles: ["admin"],
    },
    // Abas restritas para administradores
    {
      label: "A-Gastos",
      componentName: "Gastos",
      props: { letras: "A" },
      allowedRoles: ["admin"],
    },
    {
      label: "B-Gastos",
      componentName: "Gastos",
      props: { letras: "B" },
      allowedRoles: ["admin"],
    },
    {
      label: "C-Gastos",
      componentName: "Gastos",
      props: { letras: "C" },
      allowedRoles: ["admin"],
    },
    {
      label: "D-Gastos",
      componentName: "Gastos",
      props: { letras: "D" },
      allowedRoles: ["admin"],
    },
    {
      label: "E-Gastos",
      componentName: "Gastos",
      props: { letras: "E" },
      allowedRoles: ["admin"],
    },
    {
      label: "F-Gastos",
      componentName: "Gastos",
      props: { letras: "F" },
      allowedRoles: ["admin"],
    },
    {
      label: "G-Gastos",
      componentName: "Gastos",
      props: { letras: "G" },
      allowedRoles: ["admin"],
    },
    {
      label: "H-Gastos",
      componentName: "Gastos",
      props: { letras: "H" },
      allowedRoles: ["admin"],
    },
    {
      label: "I-Gastos",
      componentName: "Gastos",
      props: { letras: "I" },
      allowedRoles: ["admin"],
    },
    {
      label: "J-Gastos",
      componentName: "Gastos",
      props: { letras: "J" },
      allowedRoles: ["admin"],
    },
    {
      label: "K-Gastos",
      componentName: "Gastos",
      props: { letras: "K" },
      allowedRoles: ["admin"],
    },
    {
      label: "L-Gastos",
      componentName: "Gastos",
      props: { letras: "L" },
      allowedRoles: ["admin"],
    },
    {
      label: "Total Anual",
      componentName: "AnualContent",
      props: {},
      allowedRoles: ["admin"],
    },
    {
      label: "Cadastros",
      componentName: "Cadastro",
      props: {},
      hasUpdateComponent: true,
    },
  ];

  // Filtra e prepara as abas visíveis para o usuário atual
  const visibleTabs = allTabDefinitions
    .filter((tabDef) => {
      if (!user) return false; // Nenhum usuário logado, não mostra abas
      const component = componentMap[tabDef.componentName];
      if (!component) return false; // Componente não fornecido nas props
      if (!tabDef.allowedRoles) return true; // Aba pública para todos os usuários logados
      return tabDef.allowedRoles.includes(user.role); // Verifica se o usuário tem a permissão necessária
    })
    .map((tabDef) => {
      const ComponentToRender = componentMap[tabDef.componentName];
      return {
        ...tabDef,
        content: ComponentToRender ? (
          <ComponentToRender {...tabDef.props} />
        ) : (
          "Carregando..."
        ),
      };
    });

  // Garante que uma aba esteja marcada como 'checked'
  const isAnyTabChecked = visibleTabs.some((tab) => tab.checked);
  if (!isAnyTabChecked && visibleTabs.length > 0) {
    const m1Tab = visibleTabs.find((tab) => tab.label === "M1"); // Tenta marcar M1 se visível
    if (m1Tab) {
      m1Tab.checked = true;
    } else {
      visibleTabs[0].checked = true; // Marca a primeira aba visível
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="tabs tabs-lifted flex items-center">
        {visibleTabs.map((tab, index) => {
          const tabId = `tab-${tab.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${index}`;
          return (
            <React.Fragment key={tabId}>
              {tab.hasUpdateComponent ? (
                // Aba especial para Cadastros com componente Update
                <>
                  <input
                    type="radio"
                    name="my_tabs_nav" // Nome do grupo de radio buttons
                    id={tabId}
                    className="hidden [&:checked~div.tab-content]:!block peer" // `peer` pode ser usado com `peer-checked` na label
                    defaultChecked={tab.checked}
                  />
                  <label
                    htmlFor={tabId}
                    className="tab px-2 flex items-center gap-1 hover:bg-base-200"
                  >
                    {tab.label}
                    <Update />
                  </label>
                </>
              ) : (
                <input
                  type="radio"
                  name="my_tabs_nav"
                  id={tabId}
                  className="tab px-2"
                  aria-label={tab.label}
                  defaultChecked={tab.checked}
                />
              )}

              <div className="tab-content bg-base-100 border-base-300 rounded-box p-2">
                {tab.content}
              </div>
            </React.Fragment>
          );
        })}

        {user && (
          <div className="ml-auto flex items-center gap-2 p-2">
            <span className="text-sm">
              Olá, {user.username} (
              {user.role === "admin" ? "Admin" : "Usuário"})
            </span>
            <button
              onClick={logout}
              className="btn btn-xs btn-outline btn-error"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default NavBar;
